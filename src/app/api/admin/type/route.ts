import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookie } from "@/lib/auth";
import { adminCreateType, adminDeleteType } from "@/data/admin";

export async function POST(req: NextRequest) {
  if (!await verifyAdminCookie()) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { name } = await req.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "类型名不能为空" }, { status: 400 });
  }

  const type = await adminCreateType(name.trim());
  if (!type) return NextResponse.json({ error: "创建失败，类型可能已存在" }, { status: 400 });

  return NextResponse.json({ ok: true, id: type.id });
}

export async function DELETE(req: NextRequest) {
  if (!await verifyAdminCookie()) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  const ok = await adminDeleteType(id);
  if (!ok) return NextResponse.json({ error: "删除失败" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
