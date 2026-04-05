import { prisma } from "@/lib/prisma";
import { getStoreIdFromAuth } from "@/lib/store-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const storeId = await getStoreIdFromAuth();
  const { name, description, categoryId, variants, image } = await req.json();

  if (!name || !categoryId || !variants || variants.length === 0) {
    return NextResponse.json({ error: "Name, category, and at least one variant are required" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name, description: description || "", image: image || "", categoryId, storeId,
      variants: { create: variants.map((v: { size: string; price: number }) => ({ size: v.size, price: v.price })) },
    },
    include: { variants: true },
  });

  for (const variant of product.variants) {
    const input = variants.find((v: { size: string }) => v.size === variant.size);
    if (input?.recipe?.length > 0) {
      await prisma.recipeItem.createMany({
        data: input.recipe.map((r: { ingredientId: number; quantity: number }) => ({
          productVariantId: variant.id, ingredientId: r.ingredientId, quantity: r.quantity,
        })),
      });
    }
  }

  const full = await prisma.product.findUnique({
    where: { id: product.id },
    include: { category: true, variants: { include: { recipe: { include: { ingredient: true } } }, orderBy: { price: "asc" } } },
  });
  return NextResponse.json(full, { status: 201 });
}
