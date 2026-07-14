import "server-only";
import { supabaseService } from "@/lib/supabase";
import type { AdminEntry, AdminTag, AdminType } from "@/lib/types";

//  ── 条目 CRUD ──

// 管理端筛选条件：多选类型 / 多选标签 id / 状态（'visible' | 'hidden' 的子集，空=全部）/ 全文搜索词
export interface AdminFetchFilters {
  types?: string[];
  tagIds?: number[];
  statuses?: ("visible" | "hidden")[]; // 空数组 或 未传 = 不过滤（管理端默认展示所有，含已隐藏）
  q?: string;
}

export async function adminFetchEntries(params?: {
  page?: number;
  limit?: number;
} & AdminFetchFilters): Promise<{ entries: AdminEntry[]; total: number }> {
  const { page = 1, limit = 10, types, tagIds, statuses, q } = params || {};

  // 多选标签：按多个 tagId 取它们各自命中的 entry id，取并集（任一标签命中即纳入）
  let tagFilteredIds: number[] | null = null;
  if (tagIds && tagIds.length > 0) {
    const { data: etRows } = await supabaseService
      .from("wi_entry_tags")
      .select("entry_id")
      .in("tag_id", tagIds);
    tagFilteredIds = [...new Set((etRows || []).map((r: any) => r.entry_id))];
    if (tagFilteredIds.length === 0) {
      return { entries: [], total: 0 };
    }
  }

  // 构建 data 查询（含数据库层筛选 + 排序 + 分页）
  let dataQuery = supabaseService
    .from("wi_entries")
    .select("*")
    .order("updated_at", { ascending: false });
  // 构建 count 查询（与 data 查询应用完全相同的 where 条件，仅做计数）
  let countQuery = supabaseService
    .from("wi_entries")
    .select("*", { count: "exact", head: true });

  // 多选类型：type IN (...)
  if (types && types.length > 0) {
    dataQuery = dataQuery.in("type", types);
    countQuery = countQuery.in("type", types);
  }
  if (tagFilteredIds) {
    dataQuery = dataQuery.in("id", tagFilteredIds);
    countQuery = countQuery.in("id", tagFilteredIds);
  }
  // 多选状态：statuses 是 'visible' | 'hidden' 的子集。长度 0/未传 = 不过滤；1 = eq hidden；2 = 两者都要 = 不过滤
  if (statuses && statuses.length === 1) {
    const hidden = statuses[0] === "hidden";
    dataQuery = dataQuery.eq("hidden", hidden);
    countQuery = countQuery.eq("hidden", hidden);
  }
  const search = (q || "").trim();
  if (search) {
    const orExpr = `title.ilike.%${search}%,meaning.ilike.%${search}%,source.ilike.%${search}%,author.ilike.%${search}%,example.ilike.%${search}%`;
    dataQuery = dataQuery.or(orExpr);
    countQuery = countQuery.or(orExpr);
  }

  // 先发 count；拿到总数后再 clamp page，最后做 data 查询，
  // 避免 range 超出边界抛 "Requested range not satisfiable"
  const { count, error: ce } = await countQuery;
  if (ce) {
    console.error("adminFetchEntries count error:", ce);
    return { entries: [], total: 0 };
  }
  const total = count || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  dataQuery = dataQuery.range((safePage - 1) * limit, safePage * limit - 1);

  const { data: entries, error: e1 } = await dataQuery;
  if (e1) {
    console.error("adminFetchEntries error:", e1);
    return { entries: [], total: 0 };
  }

  // 仅查询当前页条目的标签关联（修复原全量拉取的低效）
  const entryIds = (entries || []).map((r: any) => r.id);
  const tagIdsByEntry = new Map<number, number[]>();
  if (entryIds.length > 0) {
    const { data: etRows } = await supabaseService
      .from("wi_entry_tags")
      .select("entry_id, tag_id")
      .in("entry_id", entryIds);
    (etRows || []).forEach((row: any) => {
      const list = tagIdsByEntry.get(row.entry_id) || [];
      list.push(row.tag_id);
      tagIdsByEntry.set(row.entry_id, list);
    });
  }

  return {
    total: count || 0,
    entries: (entries || []).map((row: any) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      meaning: row.meaning,
      source: row.source,
      author: row.author,
      example: row.example,
      hidden: row.hidden || false,
      tagIds: tagIdsByEntry.get(row.id) || [],
      updated_at: row.updated_at,
    })),
  };
}

export async function adminGetEntry(id: number): Promise<AdminEntry | null> {
  const { data, error } = await supabaseService
    .from("wi_entries")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const { data: etRows } = await supabaseService
    .from("wi_entry_tags")
    .select("tag_id")
    .eq("entry_id", id);

  return {
    id: data.id,
    type: data.type,
    title: data.title,
    meaning: data.meaning,
    source: data.source,
    author: data.author,
    example: data.example,
    hidden: data.hidden || false,
    tagIds: (etRows || []).map((r: any) => r.tag_id),
    updated_at: data.updated_at,
  };
}

export async function adminCreateEntry(entry: Omit<AdminEntry, "id">): Promise<AdminEntry | null> {
  const { tagIds, ...fields } = entry;

  const { data, error } = await supabaseService
    .from("wi_entries")
    .insert(fields)
    .select()
    .single();

  if (error) {
    console.error("adminCreateEntry error:", error);
    return null;
  }

  if (tagIds.length > 0) {
    const { error: tagError } = await supabaseService.from("wi_entry_tags").insert(
      tagIds.map((tag_id) => ({ entry_id: data.id, tag_id }))
    );
    if (tagError) {
      console.error("adminCreateEntry tags error:", tagError);
      await supabaseService.from("wi_entries").delete().eq("id", data.id);
      return null;
    }
  }

  return { ...entry, id: data.id };
}

export async function adminUpdateEntry(id: number, entry: Omit<AdminEntry, "id">): Promise<boolean> {
  const { tagIds, ...fields } = entry;

  const { error } = await supabaseService
    .from("wi_entries")
    .update(fields)
    .eq("id", id);

  if (error) {
    console.error("adminUpdateEntry error:", error);
    return false;
  }

  // 全量替换标签关联：先删旧关联，再插入新关联
  const { error: deleteErr } = await supabaseService
    .from("wi_entry_tags")
    .delete()
    .eq("entry_id", id);

  if (deleteErr) {
    console.error("adminUpdateEntry delete tags error:", deleteErr);
    return false;
  }

  if (tagIds.length > 0) {
    const { error: insertErr } = await supabaseService
      .from("wi_entry_tags")
      .insert(tagIds.map((tag_id) => ({ entry_id: id, tag_id })));

    if (insertErr) {
      console.error("adminUpdateEntry insert tags error:", insertErr);
      return false;
    }
  }

  return true;
}

export async function adminToggleHidden(id: number, hidden: boolean): Promise<boolean> {
  const { error } = await supabaseService
    .from("wi_entries")
    .update({ hidden })
    .eq("id", id);
  if (error) {
    console.error("adminToggleHidden error:", error);
    return false;
  }
  return true;
}

export async function adminDeleteEntry(id: number): Promise<boolean> {
  // 先删标签关联
  const { error: relErr } = await supabaseService
    .from("wi_entry_tags")
    .delete()
    .eq("entry_id", id);
  if (relErr) {
    console.error("adminDeleteEntry entry_tags error:", relErr);
    return false;
  }

  const { error } = await supabaseService.from("wi_entries").delete().eq("id", id);
  if (error) {
    console.error("adminDeleteEntry error:", error);
    return false;
  }
  return true;
}

//  ── 标签管理 ──

export async function adminFetchTags(): Promise<AdminTag[]> {
  const { data, error } = await supabaseService
    .from("wi_tags")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("adminFetchTags error:", error);
    return [];
  }
  return data || [];
}

export async function adminCreateTag(name: string): Promise<AdminTag | null> {
  const { data, error } = await supabaseService
    .from("wi_tags")
    .insert({ name })
    .select()
    .single();

  if (error) {
    console.error("adminCreateTag error:", error);
    return null;
  }
  return data;
}

export async function adminDeleteTag(id: number): Promise<boolean> {
  // 先清理关联数据，再删标签
  const { error: relErr } = await supabaseService
    .from("wi_entry_tags")
    .delete()
    .eq("tag_id", id);

  if (relErr) {
    console.error("adminDeleteTag entry_tags error:", relErr);
    return false;
  }

  const { error } = await supabaseService.from("wi_tags").delete().eq("id", id);
  if (error) {
    console.error("adminDeleteTag error:", error);
    return false;
  }
  return true;
}

//  ── 类型管理 ──

export async function adminFetchTypes(): Promise<AdminType[]> {
  const { data, error } = await supabaseService
    .from("wi_types")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("adminFetchTypes error:", error);
    return [];
  }
  return data || [];
}

export async function adminCreateType(name: string): Promise<AdminType | null> {
  const { data, error } = await supabaseService
    .from("wi_types")
    .insert({ name })
    .select()
    .single();

  if (error) {
    console.error("adminCreateType error:", error);
    return null;
  }
  return data;
}

export async function adminDeleteType(id: number): Promise<boolean> {
  // 先查出类型名，以便清理 wi_entries 中的引用
  const { data: typeRow } = await supabaseService
    .from("wi_types")
    .select("name")
    .eq("id", id)
    .single();

  if (!typeRow) {
    console.error("adminDeleteType: 类型不存在");
    return false;
  }

  // 把引用该条目的 type 字段清空，避免留下"幽灵类型"
  const { error: updateErr } = await supabaseService
    .from("wi_entries")
    .update({ type: "" })
    .eq("type", typeRow.name);

  if (updateErr) {
    console.error("adminDeleteType update entries error:", updateErr);
    return false;
  }

  const { error } = await supabaseService.from("wi_types").delete().eq("id", id);
  if (error) {
    console.error("adminDeleteType error:", error);
    return false;
  }
  return true;
}
