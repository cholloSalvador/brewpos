import { prisma } from "@/lib/prisma";
import { getStoreIdFromAuth } from "@/lib/store-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const storeId = await getStoreIdFromAuth();
    const ingredientId = req.nextUrl.searchParams.get("ingredientId");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100");

    const logs = await prisma.stockLog.findMany({
      where: { storeId, ...(ingredientId ? { ingredientId: parseInt(ingredientId) } : {}) },
      include: { ingredient: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json(logs);
  } catch { return NextResponse.json([], { status: 200 }); }
}
