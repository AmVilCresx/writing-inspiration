import { NextRequest, NextResponse } from "next/server";
import { fetchEntries } from "@/data/entries";

// 获取公开条目列表（供前端 client-side 分页/筛选）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const PAGE_SIZE = 50;

  // 多取一条用于判断是否有下一页
  const entries = await fetchEntries({
    query: q || undefined,
    type: type || undefined,
    limit: PAGE_SIZE + 1,
    offset: (page - 1) * PAGE_SIZE,
  });

  const hasMore = entries.length > PAGE_SIZE;
  const trimmed = entries.slice(0, PAGE_SIZE);

  return NextResponse.json({ entries: trimmed, totalPages: hasMore ? page + 1 : page });
}
