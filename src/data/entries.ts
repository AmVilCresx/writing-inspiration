import "server-only";
import { supabaseAnon } from "@/lib/supabase";
import type { Entry, Tag } from "@/lib/types";

//  标签辅助查询
async function fetchTagsForEntries(entryIds: number[]): Promise<Map<number, Tag[]>> {
  if (entryIds.length === 0) return new Map();

  const { data: etRows, error: etError } = await supabaseAnon
    .from("wi_entry_tags")
    .select("entry_id, tag_id")
    .in("entry_id", entryIds);

  if (etError || !etRows || etRows.length === 0) {
    return new Map(entryIds.map((id) => [id, []]));
  }

  const tagIds = [...new Set(etRows.map((r) => r.tag_id))];
  const { data: tagRows, error: tagError } = await supabaseAnon
    .from("wi_tags")
    .select("id, name")
    .in("id", tagIds);

  if (tagError || !tagRows) {
    return new Map(entryIds.map((id) => [id, []]));
  }

  const tagMap = new Map<number, Tag>();
  tagRows.forEach((t) => tagMap.set(t.id, { id: t.id, name: t.name }));

  const result = new Map<number, Tag[]>();
  entryIds.forEach((id) => result.set(id, []));

  etRows.forEach((row) => {
    const tag = tagMap.get(row.tag_id);
    if (tag) {
      const list = result.get(row.entry_id) || [];
      list.push(tag);
    }
  });

  return result;
}

function mapEntry(row: any, tags: Tag[] = []): Entry {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    meaning: row.meaning,
    source: row.source,
    author: row.author,
    example: row.example,
    tags,
  };
}

//  获取随机条目 —— 改用 limit(100) + 随机挑选，避免 count(*) 全表扫描
export async function fetchRandomEntry(): Promise<Entry | null> {
  const { data } = await supabaseAnon
    .from("wi_entries")
    .select("*")
    .eq("hidden", false)
    .limit(100)
    .order("id", { ascending: true });

  if (!data || data.length === 0) return null;

  const row = data[Math.floor(Math.random() * data.length)];
  const tags = await fetchTagsForEntries([row.id]);
  return mapEntry(row, tags.get(row.id) || []);
}

//  获取条目列表（带标签）
export async function fetchEntries(params?: {
  query?: string;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<Entry[]> {
  const { query, type, limit, offset } = params || {};

  let builder = supabaseAnon
    .from("wi_entries")
    .select("*")
    .eq("hidden", false)
    .order("id", { ascending: true });

  if (type) builder = builder.eq("type", type);

  if (query) {
    const q = query.trim();
    builder = builder.or(
      `title.ilike.%${q}%,meaning.ilike.%${q}%,source.ilike.%${q}%,author.ilike.%${q}%,example.ilike.%${q}%`
    );
  }

  const effectiveLimit = limit ?? 50;
  builder = builder.limit(effectiveLimit);
  if (offset) builder = builder.range(offset, offset + effectiveLimit - 1);

  const { data, error } = await builder;
  if (error) {
    console.error("fetchEntries error:", error);
    return [];
  }

  let entries = (data || []) as any[];

  // 搜索词额外匹配标签
  if (query) {
    const q = query.trim();
    const { data: matchedTags } = await supabaseAnon
      .from("wi_tags")
      .select("id")
      .ilike("name", `%${q}%`);

    if (matchedTags && matchedTags.length > 0) {
      const tagIds = matchedTags.map((t) => t.id);
      const { data: etRows } = await supabaseAnon
        .from("wi_entry_tags")
        .select("entry_id")
        .in("tag_id", tagIds);

      if (etRows && etRows.length > 0) {
        const matchedEntryIds = [...new Set(etRows.map((r) => r.entry_id))];
        const { data: tagMatchedEntries } = await supabaseAnon
          .from("wi_entries")
          .select("*")
          .in("id", matchedEntryIds)
          .eq("hidden", false)
          .order("id", { ascending: true });

        if (tagMatchedEntries) {
          const existingIds = new Set(entries.map((e) => e.id));
          tagMatchedEntries.forEach((e: any) => {
            if (!existingIds.has(e.id)) entries.push(e);
          });
        }
      }
    }
  }

  const entryIds = entries.map((e) => e.id);
  const tagsMap = await fetchTagsForEntries(entryIds);

  return entries.map((row) => mapEntry(row, tagsMap.get(row.id) || []));
}

//  获取单条条目
export async function fetchEntryById(id: string): Promise<Entry | null> {
  const { data, error } = await supabaseAnon
    .from("wi_entries")
    .select("*")
    .eq("id", id)
    .eq("hidden", false)
    .single();

  if (error || !data) return null;

  const tagsMap = await fetchTagsForEntries([data.id]);
  return mapEntry(data, tagsMap.get(data.id) || []);
}

//  获取相关推荐（同类型或共享标签）
export async function fetchRelated(entry: Entry): Promise<Entry[]> {
  const tagIds = entry.tags.map((t) => t.id);

  let builder = supabaseAnon
    .from("wi_entries")
    .select("*")
    .neq("id", entry.id)
    .eq("hidden", false)
    .limit(8);

  if (entry.type) builder = builder.eq("type", entry.type);

  const { data, error } = await builder;
  if (error || !data) return [];

  const rows = (data as any[]);
  const entryIds = rows.map((r) => r.id);
  const tagsMap = await fetchTagsForEntries(entryIds);

  return rows
    .map((row) => mapEntry(row, tagsMap.get(row.id) || []))
    .map((e) => ({
      ...e,
      _shared: e.tags.filter((t) => tagIds.includes(t.id)).length,
    }))
    .sort((a, b) => b._shared - a._shared)
    .slice(0, 5)
    .map(({ _shared, ...e }) => e);
}

//  获取所有类型
export async function fetchTypes(): Promise<{ id: number; name: string }[]> {
  const { data, error } = await supabaseAnon
    .from("wi_types")
    .select("id, name")
    .order("id", { ascending: true });

  if (error) {
    console.error("fetchTypes error:", error);
    return [];
  }
  return data || [];
}

//  获取标签总数和条目总数
export async function fetchCounts(): Promise<{ entries: number; tags: number }> {
  const [{ count: entries }, { count: tags }] = await Promise.all([
    supabaseAnon.from("wi_entries").select("*", { count: "exact", head: true }),
    supabaseAnon.from("wi_tags").select("*", { count: "exact", head: true }),
  ]);
  return { entries: entries || 0, tags: tags || 0 };
}