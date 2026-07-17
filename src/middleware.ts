import { NextResponse, NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/constants";

/**
 * 轻量级 JWT 有效期校验（Edge runtime 兼容）。
 * 仅检查 exp 字段，不验证签名（签名验证由 admin layout 的 verifyAdminCookie 完成）。
 * 目的：在中间件层拦截已过期的 token，清除 cookie，防止重定向死循环。
 */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    // Edge runtime 兼容：用 atob 代替 Buffer
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    if (typeof payload.exp !== "number") return true;
    return payload.exp < Math.floor(Date.now() / 1000) + 30;
  } catch {
    return true;
  }
}

/** 构造不缓存的重定向响应 */
function noCacheRedirect(url: URL) {
  const res = NextResponse.redirect(url);
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const hasCookie = !!token;
  const expired = hasCookie && isTokenExpired(token!);

  const isAuthPage = pathname === "/login" || pathname === "/password";
  const isProtected = pathname.startsWith("/admin") && !isAuthPage;

  // token 已过期：清除 cookie 后按当前页面类型处理
  if (expired) {
    if (isProtected) {
      const res = noCacheRedirect(new URL("/login", req.url));
      res.cookies.delete(COOKIE_NAME);
      return res;
    }
    if (isAuthPage) {
      const res = NextResponse.next();
      res.cookies.delete(COOKIE_NAME);
      return res;
    }
  }

  if (isProtected && !hasCookie) {
    return noCacheRedirect(new URL("/login", req.url));
  }

  if (isAuthPage && hasCookie) {
    return noCacheRedirect(new URL("/admin/entries", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/password"],
};
