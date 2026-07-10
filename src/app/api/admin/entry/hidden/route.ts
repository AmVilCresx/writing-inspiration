import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookie } from "@/lib/auth";
import { adminToggleHidden } from "@/data/admin";

export async function PATCH(req: NextRequest) {
  if (!verifyAdminCookie()) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id, hidden } = await req.json();
  if (id === undefined || hidden === undefined) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  }

  const ok = await adminToggleHidden(id, hidden);
  if (!ok) return NextResponse.json({ error: "操作失败" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
