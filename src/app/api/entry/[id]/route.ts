import { NextRequest, NextResponse } from "next/server";
import { fetchEntryById } from "@/data/entries";

// 获取单个条目详情（供前端 inline preview）
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entry = await fetchEntryById(id);
  if (!entry) return NextResponse.json({ error: "不存在" }, { status: 404 });
  return NextResponse.json({ entry });
}
