import { prisma } from "@/lib/prisma";
import { getStoreIdFromAuth } from "@/lib/store-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const storeId = await getStoreIdFromAuth();
    const categories = await prisma.category.findMany({
      where: { storeId },
      include: { _count: { select: { products: true } } },
      orderBy: { id: "asc" },
    });
    return NextResponse.json(categories);
  } catch { return NextResponse.json([], { status: 200 }); }
}

export async function POST(req: NextRequest) {
  const storeId = await getStoreIdFromAuth();
  const { name, icon } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const category = await prisma.category.create({
    data: { name, icon: icon || "🍽️", storeId },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json(category, { status: 201 });
}
