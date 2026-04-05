import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  try { await requireSuperAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const stores = await prisma.store.findMany({
    include: {
      subscription: true,
      _count: { select: { users: true, orders: true, products: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(stores);
}

export async function POST(req: NextRequest) {
  try { await requireSuperAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const body = await req.json();
  const { name, address, phone, email, ownerName, ownerEmail, ownerPassword, plan, months } = body;

  if (!name || !ownerEmail || !ownerPassword) {
    return NextResponse.json({ error: "Store name, owner email and password are required" }, { status: 400 });
  }

  // Check if owner email exists
  const existing = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (existing) {
    return NextResponse.json({ error: "Owner email already exists" }, { status: 400 });
  }

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + (months || 1));

  const store = await prisma.store.create({
    data: {
      name,
      address: address || "",
      phone: phone || "",
      email: email || "",
      subscription: {
        create: {
          plan: plan || "monthly",
          status: "active",
          endDate,
          amount: (plan === "yearly" ? 9999 : 999) * (months || 1),
        },
      },
      users: {
        create: {
          email: ownerEmail,
          password: await bcrypt.hash(ownerPassword, 12),
          name: ownerName || "Store Owner",
          role: "owner",
        },
      },
    },
    include: {
      subscription: true,
      _count: { select: { users: true, orders: true, products: true } },
    },
  });

  return NextResponse.json(store, { status: 201 });
}

export async function PUT(req: NextRequest) {
  try { await requireSuperAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const body = await req.json();
  const { id, name, address, phone, email, active } = body;

  const store = await prisma.store.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(active !== undefined && { active }),
    },
    include: { subscription: true, _count: { select: { users: true, orders: true, products: true } } },
  });

  return NextResponse.json(store);
}

export async function DELETE(req: NextRequest) {
  try { await requireSuperAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const { id } = await req.json();
  await prisma.store.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
