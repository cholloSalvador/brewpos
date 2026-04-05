import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  try { await requireSuperAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const users = await prisma.user.findMany({
    include: { store: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users.map((u) => ({ ...u, password: undefined })));
}

export async function POST(req: NextRequest) {
  try { await requireSuperAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const body = await req.json();
  const { email, password, name, role, storeId } = body;

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(password, 12),
      name,
      role: role || "staff",
      storeId: storeId || null,
    },
    include: { store: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ ...user, password: undefined }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  try { await requireSuperAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const body = await req.json();
  const { id, email, name, role, storeId, active, password } = body;

  const data: Record<string, unknown> = {};
  if (email !== undefined) data.email = email;
  if (name !== undefined) data.name = name;
  if (role !== undefined) data.role = role;
  if (storeId !== undefined) data.storeId = storeId || null;
  if (active !== undefined) data.active = active;
  if (password) data.password = await bcrypt.hash(password, 12);

  const user = await prisma.user.update({
    where: { id },
    data,
    include: { store: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ ...user, password: undefined });
}

export async function DELETE(req: NextRequest) {
  try { await requireSuperAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const { id } = await req.json();
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
