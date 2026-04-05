import { prisma } from "@/lib/prisma";
import { getStoreIdFromAuth } from "@/lib/store-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const storeId = await getStoreIdFromAuth();
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");
    const orders = await prisma.order.findMany({
      where: { storeId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json(orders);
  } catch { return NextResponse.json([], { status: 200 }); }
}

export async function POST(req: NextRequest) {
  const storeId = await getStoreIdFromAuth();
  const { items, paymentMethod = "cash", customerName = "" } = await req.json();

  let subtotal = 0;
  for (const item of items) subtotal += item.price * item.quantity;
  const tax = Math.round(subtotal * 0.12 * 100) / 100;
  const total = subtotal + tax;

  const today = new Date();
  const prefix = `ORD-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const todayCount = await prisma.order.count({ where: { orderNumber: { startsWith: prefix }, storeId } });
  const orderNumber = `${prefix}-${String(todayCount + 1).padStart(4, "0")}`;

  for (const item of items) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.productVariantId },
      include: { recipe: { include: { ingredient: true } } },
    });
    if (!variant) return NextResponse.json({ error: "Product variant not found" }, { status: 400 });
    for (const r of variant.recipe) {
      const needed = r.quantity * item.quantity;
      if (r.ingredient.currentStock < needed) {
        return NextResponse.json({ error: `Insufficient stock for ${r.ingredient.name}. Need ${needed}${r.ingredient.unit}, have ${r.ingredient.currentStock}${r.ingredient.unit}` }, { status: 400 });
      }
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        orderNumber, customerName, subtotal, tax, total, paymentMethod, storeId,
        items: {
          create: items.map((i: { productVariantId: number; productName: string; size: string; price: number; quantity: number }) => ({
            productVariantId: i.productVariantId, productName: i.productName, size: i.size, price: i.price, quantity: i.quantity, total: i.price * i.quantity,
          })),
        },
      },
      include: { items: true },
    });

    for (const item of items) {
      const variant = await tx.productVariant.findUnique({ where: { id: item.productVariantId }, include: { recipe: true } });
      if (variant) {
        for (const r of variant.recipe) {
          const amt = r.quantity * item.quantity;
          await tx.ingredient.update({ where: { id: r.ingredientId }, data: { currentStock: { decrement: amt } } });
          await tx.stockLog.create({ data: { ingredientId: r.ingredientId, storeId, type: "out", quantity: amt, reference: newOrder.orderNumber } });
        }
      }
    }
    return newOrder;
  });

  return NextResponse.json(order, { status: 201 });
}
