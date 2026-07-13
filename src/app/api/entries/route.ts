import { NextRequest, NextResponse } from "next/server";
import { fetchEntries } from "@/data/entries";
import { PUBLIC_PAGE_SIZE } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const entries = await fetchEntries({
    query: q || undefined,
    type: type || undefined,
    limit: PUBLIC_PAGE_SIZE + 1,
    offset: (page - 1) * PUBLIC_PAGE_SIZE,
  });

  const hasMore = entries.length > PUBLIC_PAGE_SIZE;
  const trimmed = entries.slice(0, PUBLIC_PAGE_SIZE);

  return NextResponse.json({ entries: trimmed, totalPages: hasMore ? page + 1 : page });
}