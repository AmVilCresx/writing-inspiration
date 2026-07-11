import { NextResponse } from "next/server";
import { verifyAdminCookie } from "@/lib/auth";

// 返回当前登录状态，供前端 client 组件校验
export async function GET() {
  const admin = verifyAdminCookie();
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, email: admin.email });
}
