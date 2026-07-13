import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import jwt from "jsonwebtoken";
import { COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/constants";

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!JWT_SECRET) throw new Error("缺少 SUPABASE_SERVICE_ROLE_KEY");

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "请填写邮箱和密码" }, { status: 400 });
  }

  const admin = await verifyAdmin(email, password);
  if (!admin) {
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
  }

  const token = jwt.sign({ email: admin.email }, JWT_SECRET, { expiresIn: "7d" });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return response;
}