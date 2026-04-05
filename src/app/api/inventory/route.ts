import { prisma } from "@/lib/prisma";
import { getStoreIdFromAuth } from "@/lib/store-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const storeId = await getStoreIdFromAuth();
    const ingredients = await prisma.ingredient.findMany({ where: { storeId }, orderBy: { name: "asc" } });
    return NextResponse.json(ingredients);
  } catch { return NextResponse.json([], { status: 200 }); }
}

export async function PUT(req: NextRequest) {
  const storeId = await getStoreIdFromAuth();
  const { ingredientId, quantity, type, reference = "" } = await req.json();

  const updatedIngredient = await prisma.$transaction(async (tx) => {
    const updated = await tx.ingredient.update({
      where: { id: ingredientId },
      data: { currentStock: type === "adjustment" ? quantity : { increment: quantity } },
    });
    await tx.stockLog.create({ data: { ingredientId, storeId, type, quantity, reference } });
    return updated;
  });

  return NextResponse.json(updatedIngredient);
}
