import { verifyAdminCookie } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminEntryList from "@/components/AdminEntryList";
import { adminFetchEntries, adminFetchTags, adminFetchTypes, type AdminFetchFilters } from "@/data/admin";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    type?: string | string[];
    tag?: string | string[];
    status?: string | string[];
    q?: string;
  }>;
}) {
  const admin = await verifyAdminCookie();
  if (!admin) redirect("/login");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const q = sp.q?.toString().trim() || undefined;
  // URL 多值 ?type=a&type=b 或逗号 ?type=a,b 都支持
  const typeNames = uniqNonEmpty(toArr(sp.type));
  const tagIds = uniqNonEmpty(toArr(sp.tag))
    .map((t) => parseInt(t, 10))
    .filter(Number.isInteger);
  const statuses = uniqNonEmpty(toArr(sp.status)).filter(
    (s): s is "visible" | "hidden" => s === "visible" || s === "hidden",
  );

  const filters: AdminFetchFilters = { types: typeNames, tagIds, statuses, q };

  const [{ entries, total }, tags, allTypes] = await Promise.all([
    adminFetchEntries({ page, limit: ADMIN_PAGE_SIZE, ...filters }),
    adminFetchTags(),
    adminFetchTypes(),
  ]);

  return (
    <AdminEntryList
      entries={entries}
      tags={tags}
      types={allTypes}
      total={total}
      page={page}
      pageSize={ADMIN_PAGE_SIZE}
      filters={filters}
    />
  );
}

// 把多值（数组 / 逗号字符串）清洗成去重非空字符串数组
function toArr(v: string | string[] | undefined): string[] {
  if (v == null) return [];
  const flat = Array.isArray(v) ? v : v.split(",");
  return flat.map((s) => s.trim()).filter(Boolean);
}

function uniqNonEmpty(arr: string[]): string[] {
  return [...new Set(arr)];
}
