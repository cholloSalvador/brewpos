import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret");

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths - be explicit
  if (
    pathname === "/login" ||
    pathname === "/trial" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/trial") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/uploads") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth-token")?.value;
  if (!token) {
    // API routes return 401 instead of redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    // Only superadmin can access /admin
    if ((pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) && role !== "superadmin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Superadmin on store pages -> redirect to admin
    if (role === "superadmin" && !pathname.startsWith("/admin") && !pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set("auth-token", "", { maxAge: 0, path: "/" });
    return res;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
