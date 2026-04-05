import { prisma } from "@/lib/prisma";
import { getStoreIdFromAuth } from "@/lib/store-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const storeId = await getStoreIdFromAuth();
    const categoryId = req.nextUrl.searchParams.get("categoryId");

    const products = await prisma.product.findMany({
      where: {
        storeId,
        active: true,
        ...(categoryId ? { categoryId: parseInt(categoryId) } : {}),
      },
      include: {
        category: true,
        variants: {
          include: { recipe: { include: { ingredient: true } } },
          orderBy: { price: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(products);
  } catch { return NextResponse.json([], { status: 200 }); }
}
