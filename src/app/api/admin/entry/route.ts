import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookie } from "@/lib/auth";
import { adminCreateEntry, adminUpdateEntry, adminDeleteEntry } from "@/data/admin";

// 新增
export async function POST(req: NextRequest) {
  if (!await verifyAdminCookie()) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json();
  const { type, title, meaning, source, author, example, tagIds } = body;

  if (!type || !title) {
    return NextResponse.json({ error: "类型和标题不能为空" }, { status: 400 });
  }

  const entry = await adminCreateEntry({
    type,
    title,
    meaning: meaning || null,
    source: source || null,
    author: author || null,
    example: example || null,
    hidden: false,
    tagIds: tagIds || [],
  });

  if (!entry) return NextResponse.json({ error: "创建失败" }, { status: 500 });
  return NextResponse.json({ ok: true, id: entry.id });
}

// 修改
export async function PUT(req: NextRequest) {
  if (!await verifyAdminCookie()) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json();
  const { id, type, title, meaning, source, author, example, tagIds } = body;

  if (!id || !type || !title) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  }

  const ok = await adminUpdateEntry(id, {
    type,
    title,
    meaning: meaning || null,
    source: source || null,
    author: author || null,
    example: example || null,
    hidden: body.hidden ?? true,  // 未提供则保持原有（数据库层不更新此字段）
    tagIds: tagIds || [],
  });

  if (!ok) return NextResponse.json({ error: "更新失败" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// 删除
export async function DELETE(req: NextRequest) {
  if (!await verifyAdminCookie()) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  const ok = await adminDeleteEntry(id);
  if (!ok) return NextResponse.json({ error: "删除失败" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
