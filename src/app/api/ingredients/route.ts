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

export async function POST(req: NextRequest) {
  const storeId = await getStoreIdFromAuth();
  const { name, unit, currentStock, minStock, costPerUnit } = await req.json();
  if (!name || !unit) return NextResponse.json({ error: "Name and unit are required" }, { status: 400 });

  const ingredient = await prisma.ingredient.create({
    data: { name, unit, currentStock: currentStock || 0, minStock: minStock || 0, costPerUnit: costPerUnit || 0, storeId },
  });
  return NextResponse.json(ingredient, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { id, name, unit, minStock, costPerUnit } = await req.json();
  const ingredient = await prisma.ingredient.update({
    where: { id },
    data: { ...(name !== undefined && { name }), ...(unit !== undefined && { unit }), ...(minStock !== undefined && { minStock }), ...(costPerUnit !== undefined && { costPerUnit }) },
  });
  return NextResponse.json(ingredient);
}
