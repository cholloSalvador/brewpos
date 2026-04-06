import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { storeName, ownerName, email, password, phone } = await req.json();

  if (!storeName?.trim() || !email?.trim() || !password?.trim() || !ownerName?.trim()) {
    return NextResponse.json({ error: "Store name, owner name, email, and password are required" }, { status: 400 });
  }

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered. Please login instead." }, { status: 400 });
  }

  // Create store with 14-day trial
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 14);

  const store = await prisma.store.create({
    data: {
      name: storeName,
      phone: phone || "",
      email: email,
      subscription: {
        create: {
          plan: "trial",
          status: "active",
          endDate,
          amount: 0,
          notes: "14-day free trial",
        },
      },
      users: {
        create: {
          email,
          password: await bcrypt.hash(password, 12),
          name: ownerName,
          role: "owner",
        },
      },
    },
  });

  return NextResponse.json({ success: true, storeId: store.id, message: "Trial started! You can now login." }, { status: 201 });
}
