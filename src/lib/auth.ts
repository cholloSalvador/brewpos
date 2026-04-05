import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret");

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string; // superadmin, owner, manager, staff
  storeId: number | null;
}

export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AuthUser;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getStoreId(): Promise<number | null> {
  const user = await getAuthUser();
  return user?.storeId || null;
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireSuperAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== "superadmin") throw new Error("Forbidden");
  return user;
}

export async function checkSubscription(storeId: number): Promise<{ active: boolean; daysLeft: number; subscription: { plan: string; status: string; endDate: Date } | null }> {
  const sub = await prisma.subscription.findUnique({ where: { storeId } });
  if (!sub) return { active: false, daysLeft: 0, subscription: null };

  const now = new Date();
  const endDate = new Date(sub.endDate);
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const active = sub.status === "active" && daysLeft > 0;

  return { active, daysLeft, subscription: { plan: sub.plan, status: sub.status, endDate } };
}
