import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, createAdminCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "请填写邮箱和密码" }, { status: 400 });
  }

  const admin = await verifyAdmin(email, password);
  if (!admin) {
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
  }

  createAdminCookie(admin.email);
  return NextResponse.json({ ok: true });
}
