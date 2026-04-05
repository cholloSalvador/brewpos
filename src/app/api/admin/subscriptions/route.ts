import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try { await requireSuperAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const subs = await prisma.subscription.findMany({
    include: { store: { select: { id: true, name: true, active: true } } },
    orderBy: { endDate: "asc" },
  });

  return NextResponse.json(subs);
}

export async function PUT(req: NextRequest) {
  try { await requireSuperAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const body = await req.json();
  const { id, action, months, plan, notes } = body;

  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

  if (action === "extend") {
    // Extend from current end date or now, whichever is later
    const base = new Date(sub.endDate) > new Date() ? new Date(sub.endDate) : new Date();
    base.setMonth(base.getMonth() + (months || 1));

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        endDate: base,
        status: "active",
        ...(notes !== undefined && { notes }),
      },
      include: { store: { select: { id: true, name: true } } },
    });
    return NextResponse.json(updated);
  }

  if (action === "suspend") {
    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: "suspended", ...(notes !== undefined && { notes }) },
      include: { store: { select: { id: true, name: true } } },
    });
    return NextResponse.json(updated);
  }

  if (action === "activate") {
    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: "active", ...(notes !== undefined && { notes }) },
      include: { store: { select: { id: true, name: true } } },
    });
    return NextResponse.json(updated);
  }

  // Generic update
  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      ...(plan !== undefined && { plan }),
      ...(notes !== undefined && { notes }),
    },
    include: { store: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
}
