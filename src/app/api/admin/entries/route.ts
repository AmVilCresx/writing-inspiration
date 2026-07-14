import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookie } from "@/lib/auth";
import { adminFetchEntries } from "@/data/admin";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";

// 客户端筛选 / 翻页走这里，管理端条目列表（带服务端分页 + 数据库层筛选）
export async function GET(req: NextRequest) {
  if (!(await verifyAdminCookie())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pageStr = searchParams.get("page") || "1";
  const page = Math.max(1, parseInt(pageStr, 10) || 1);

  // 多选：getAll 取同名多值；逗号兜底兼容
  const types = uniqNonEmpty(searchParams.getAll("type"));
  const tagIds = uniqNonEmpty(searchParams.getAll("tag")).map((t) => parseInt(t, 10)).filter(Number.isInteger);
  const statuses = uniqNonEmpty(searchParams.getAll("status")).filter(
    (s): s is "visible" | "hidden" => s === "visible" || s === "hidden",
  );
  const q = searchParams.get("q")?.trim() || undefined;

  try {
    const { entries, total } = await adminFetchEntries({
      page,
      limit: ADMIN_PAGE_SIZE,
      types,
      tagIds,
      statuses,
      q,
    });
    return NextResponse.json({
      entries,
      total,
      totalPages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
      page,
    });
  } catch (e) {
    console.error("GET /api/admin/entries error:", e);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}

function uniqNonEmpty(arr: string[]): string[] {
  return [...new Set(arr.flatMap((s) => s.split(",")).map((s) => s.trim()).filter(Boolean))];
}
