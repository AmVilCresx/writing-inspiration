import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminCookie } from "@/lib/auth";
import { adminCreateEntry, adminUpdateEntry, adminDeleteEntry, adminGetEntry } from "@/data/admin";

const entrySchema = z.object({
  type: z.string().min(1, "类型不能为空").max(10, "类型最多 10 个字符"),
  title: z.string().min(1, "标题不能为空").max(50, "标题最多 50 个字符"),
  meaning: z.string().max(200).nullable().optional(),
  source: z.string().max(50).nullable().optional(),
  author: z.string().max(32).nullable().optional(),
  example: z.string().max(200).nullable().optional(),
  tagIds: z.array(z.number()).max(5).optional(),
});

const entryWithIdSchema = entrySchema.extend({
  id: z.number().int().positive(),
});

// 新增
export async function POST(req: NextRequest) {
  if (!await verifyAdminCookie()) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json();
  const parsed = entrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { type, title, meaning, source, author, example, tagIds } = parsed.data;
  const entry = await adminCreateEntry({
    type,
    title,
    meaning: meaning ?? null,
    source: source ?? null,
    author: author ?? null,
    example: example ?? null,
    hidden: false,
    tagIds: tagIds ?? [],
  });

  if (!entry) return NextResponse.json({ error: "创建失败" }, { status: 500 });
  return NextResponse.json({ ok: true, id: entry.id });
}

// 修改
export async function PUT(req: NextRequest) {
  if (!await verifyAdminCookie()) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json();
  const parsed = entryWithIdSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { id, type, title, meaning, source, author, example, tagIds } = parsed.data;

  // 从数据库读取当前的 hidden 值，避免前端传入
  const existing = await adminGetEntry(id);
  if (!existing) return NextResponse.json({ error: "条目不存在" }, { status: 404 });

  const ok = await adminUpdateEntry(id, {
    type,
    title,
    meaning: meaning ?? null,
    source: source ?? null,
    author: author ?? null,
    example: example ?? null,
    hidden: existing.hidden,
    tagIds: tagIds ?? [],
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
