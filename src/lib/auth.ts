import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseService } from "./supabase";

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret";
const COOKIE_NAME = "wi_admin_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 天

export interface AdminPayload {
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * 校验邮箱密码，成功返回 admin 信息，失败返回 null
 */
export async function verifyAdmin(
  email: string,
  password: string
): Promise<{ email: string } | null> {
  const { data, error } = await supabaseService
    .from("wi_admins")
    .select("email, password_hash")
    .eq("email", email)
    .single();

  if (error || !data) return null;

  // bcrypt 校验（动态导入避免服务端/客户端问题）
  const bcrypt = await import("bcryptjs");
  const ok = await bcrypt.compare(password, data.password_hash);
  return ok ? { email: data.email } : null;
}

/**
 * 签发 JWT 并写入 Cookie
 */
export async function createAdminCookie(email: string) {
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

/**
 * 校验当前请求的登录态
 */
export async function verifyAdminCookie(): Promise<AdminPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload;
  } catch {
    return null;
  }
}

/**
 * 清除登录态
 */
export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
