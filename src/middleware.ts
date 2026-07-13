import { NextResponse, NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/constants";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasCookie = !!req.cookies.get(COOKIE_NAME)?.value;

  const isAuthPage = pathname === "/login" || pathname === "/password";
  const isProtected = pathname.startsWith("/admin") && !isAuthPage;

  if (isProtected && !hasCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthPage && hasCookie) {
    return NextResponse.redirect(new URL("/admin/entries", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/password"],
};