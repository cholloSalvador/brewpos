import { prisma } from "@/lib/prisma";
import { getStoreIdFromAuth } from "@/lib/store-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const storeId = await getStoreIdFromAuth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, totalOrders, todayRevenue, recentOrders] = await Promise.all([
      prisma.order.count({ where: { storeId, createdAt: { gte: today }, status: "completed" } }),
      prisma.order.count({ where: { storeId, status: "completed" } }),
      prisma.order.aggregate({ where: { storeId, createdAt: { gte: today }, status: "completed" }, _sum: { total: true } }),
      prisma.order.findMany({ where: { storeId }, include: { items: true }, orderBy: { createdAt: "desc" }, take: 10 }),
    ]);

    const lowStock = await prisma.$queryRaw`SELECT * FROM "Ingredient" WHERE "storeId" = ${storeId} AND "currentStock" <= "minStock"`;

    return NextResponse.json({
      todayOrders, totalOrders,
      todayRevenue: todayRevenue._sum.total || 0,
      lowStockIngredients: lowStock,
      recentOrders,
    });
  } catch { return NextResponse.json({ todayOrders: 0, totalOrders: 0, todayRevenue: 0, lowStockIngredients: [], recentOrders: [] }); }
}
