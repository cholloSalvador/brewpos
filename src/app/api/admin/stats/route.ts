import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireSuperAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totalStores, activeStores, totalUsers, totalOrders, activeSubscriptions, expiredSubscriptions, trialStores] = await Promise.all([
    prisma.store.count(),
    prisma.store.count({ where: { active: true } }),
    prisma.user.count({ where: { role: { not: "superadmin" } } }),
    prisma.order.count(),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.subscription.count({ where: { status: { not: "active" } } }),
    prisma.subscription.count({ where: { plan: "trial" } }),
  ]);

  // Revenue across all stores
  const revenue = await prisma.order.aggregate({ _sum: { total: true } });

  // Recent stores
  const recentStores = await prisma.store.findMany({
    include: {
      subscription: true,
      _count: { select: { users: true, orders: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return NextResponse.json({
    totalStores,
    activeStores,
    totalUsers,
    totalOrders,
    totalRevenue: revenue._sum.total || 0,
    activeSubscriptions,
    expiredSubscriptions,
    trialStores,
    recentStores,
  });
}
