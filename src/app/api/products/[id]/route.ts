import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: {
      category: true,
      variants: {
        include: { recipe: { include: { ingredient: true } } },
        orderBy: { price: "asc" },
      },
    },
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, description, categoryId, active, variants, image } = body;

  // Update product basic info
  const product = await prisma.product.update({
    where: { id: parseInt(id) },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(image !== undefined && { image }),
      ...(categoryId !== undefined && { categoryId }),
      ...(active !== undefined && { active }),
    },
  });

  // Update variants and recipes if provided
  if (variants) {
    for (const v of variants) {
      if (v.id) {
        // Update existing variant
        await prisma.productVariant.update({
          where: { id: v.id },
          data: { price: v.price },
        });

        // Update recipe if provided
        if (v.recipe) {
          // Remove old recipe items
          await prisma.recipeItem.deleteMany({ where: { productVariantId: v.id } });
          // Create new recipe items
          if (v.recipe.length > 0) {
            await prisma.recipeItem.createMany({
              data: v.recipe.map((r: { ingredientId: number; quantity: number }) => ({
                productVariantId: v.id,
                ingredientId: r.ingredientId,
                quantity: r.quantity,
              })),
            });
          }
        }
      } else {
        // Create new variant
        const newVariant = await prisma.productVariant.create({
          data: {
            productId: parseInt(id),
            size: v.size,
            price: v.price,
          },
        });
        if (v.recipe && v.recipe.length > 0) {
          await prisma.recipeItem.createMany({
            data: v.recipe.map((r: { ingredientId: number; quantity: number }) => ({
              productVariantId: newVariant.id,
              ingredientId: r.ingredientId,
              quantity: r.quantity,
            })),
          });
        }
      }
    }
  }

  const updated = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: {
      category: true,
      variants: { include: { recipe: { include: { ingredient: true } } }, orderBy: { price: "asc" } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.product.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
