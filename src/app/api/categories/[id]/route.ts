import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, icon } = body;

  const category = await prisma.category.update({
    where: { id: parseInt(id) },
    data: {
      ...(name !== undefined && { name }),
      ...(icon !== undefined && { icon }),
    },
    include: { _count: { select: { products: true } } },
  });

  return NextResponse.json(category);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Check if category has products
  const count = await prisma.product.count({ where: { categoryId: parseInt(id) } });
  if (count > 0) {
    return NextResponse.json(
      { error: `Cannot delete category with ${count} product(s). Move or delete them first.` },
      { status: 400 }
    );
  }

  await prisma.category.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
