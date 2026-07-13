import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseService } from "./supabase";
import { COOKIE_NAME, SESSION_MAX_AGE } from "./constants";

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!JWT_SECRET) {
  throw new Error("缺少环境变量 SUPABASE_SERVICE_ROLE_KEY");
}

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

  const bcrypt = await import("bcryptjs");
  const ok = await bcrypt.compare(password, data.password_hash);
  return ok ? { email: data.email } : null;
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