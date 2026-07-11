import { NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret";
const COOKIE_NAME = "wi_admin_token";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;

  let isAuthed = false;
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      isAuthed = true;
    } catch {
      isAuthed = false;
    }
  }

  // 受保护路径：不在 /login 或 /password
  const isAuthPage = pathname === "/login" || pathname === "/password";
  const isProtected = pathname.startsWith("/admin") && !isAuthPage;

  if (isProtected && !isAuthed) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthPage && isAuthed) {
    return NextResponse.redirect(new URL("/admin/entries", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/password"],
};
