import { prisma } from "@/lib/prisma";
import { createToken, getAuthUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// Login
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Check subscription for non-superadmin
  if (user.role !== "superadmin" && user.storeId) {
    const sub = await prisma.subscription.findUnique({ where: { storeId: user.storeId } });
    if (!sub || sub.status !== "active" || new Date(sub.endDate) < new Date()) {
      return NextResponse.json({ error: "Store subscription has expired. Contact your administrator." }, { status: 403 });
    }
  }

  const token = await createToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    storeId: user.storeId,
  });

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, storeId: user.storeId },
  });

  res.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return res;
}

// Get current user
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ user });
}

// Logout
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("auth-token", "", { maxAge: 0, path: "/" });
  return res;
}
