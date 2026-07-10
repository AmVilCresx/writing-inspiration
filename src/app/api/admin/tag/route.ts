import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookie } from "@/lib/auth";
import { adminCreateTag, adminDeleteTag } from "@/data/admin";

// 新增标签
export async function POST(req: NextRequest) {
  if (!verifyAdminCookie()) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { name } = await req.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "标签名不能为空" }, { status: 400 });
  }

  const tag = await adminCreateTag(name.trim());
  if (!tag) return NextResponse.json({ error: "创建失败，标签可能已存在" }, { status: 400 });

  return NextResponse.json({ ok: true, id: tag.id });
}

// 删除标签
export async function DELETE(req: NextRequest) {
  if (!verifyAdminCookie()) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  const ok = await adminDeleteTag(id);
  if (!ok) return NextResponse.json({ error: "删除失败" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
