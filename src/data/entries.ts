import "server-only";
import { supabaseAnon } from "@/lib/supabase";

//  Entry 类型与数据库 wi_entries 表对应
export interface Entry {
  id: number;
  type: "成语" | "名言" | "俗语" | "诗词" | "歇后语";
  title: string;
  meaning: string | null;
  source: string | null;
  author: string | null;
  example: string | null;
  mood: string | null;
  tags: Tag[];
}

export interface Tag {
  id: number;
  name: string;
}

/**
 * 批量获取条目的标签信息
 */
async function fetchTagsForEntries(entryIds: number[]): Promise<Map<number, Tag[]>> {
  if (entryIds.length === 0) return new Map();

  // 先查关联表
  const { data: etRows, error: etError } = await supabaseAnon
    .from("wi_entry_tags")
    .select("entry_id, tag_id")
    .in("entry_id", entryIds);

  if (etError || !etRows || etRows.length === 0) {
    return new Map(entryIds.map((id) => [id, []]));
  }

  // 再查标签名
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

  // 按 entry_id 分组
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
    mood: row.mood,
    tags,
  };
}

/**
 * 从数据库获取条目列表（带标签）
 */
export async function fetchEntries(params?: {
  query?: string;
  type?: string;
  mood?: string;
  limit?: number;
  offset?: number;
}): Promise<Entry[]> {
  const { query, type, mood, limit, offset } = params || {};

  let builder = supabaseAnon
    .from("wi_entries")
    .select("*")
    .eq("hidden", false)
    .order("id", { ascending: true });

  if (type) builder = builder.eq("type", type);
  if (mood) builder = builder.eq("mood", mood);

  // 搜索：标题、释义、出处、作者、例句
  if (query) {
    const q = query.trim();
    builder = builder.or(
      `title.ilike.%${q}%,meaning.ilike.%${q}%,source.ilike.%${q}%,author.ilike.%${q}%,example.ilike.%${q}%`
    );
  }

  if (limit) builder = builder.limit(limit);
  if (offset) builder = builder.range(offset, offset + limit - 1);

  // 先查主表
  const { data, error } = await builder;
  if (error) {
    console.error("fetchEntries error:", error);
    return [];
  }

  let entries = (data || []) as any[];

  // 如果有搜索词，额外从标签匹配
  if (query) {
    const q = query.trim();

    // 1. 查出匹配的标签
    const { data: matchedTags } = await supabaseAnon
      .from("wi_tags")
      .select("id")
      .ilike("name", `%${q}%`);

    if (matchedTags && matchedTags.length > 0) {
      // 2. 找出关联了这些标签的 entry_id
      const tagIds = matchedTags.map((t) => t.id);
      const { data: etRows } = await supabaseAnon
        .from("wi_entry_tags")
        .select("entry_id")
        .in("tag_id", tagIds);

      if (etRows && etRows.length > 0) {
        // 3. 查这些 entry
        const matchedEntryIds = [...new Set(etRows.map((r) => r.entry_id))];
        const { data: tagMatchedEntries } = await supabaseAnon
          .from("wi_entries")
          .select("*")
          .in("id", matchedEntryIds)
          .eq("hidden", false)
          .order("id", { ascending: true });

        if (tagMatchedEntries) {
          // 4. 合并去重
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

/**
 * 获取单条条目（详情页）
 */
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

/**
 * 获取相关推荐（同类型或共享标签）
 */
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

/**
 * 获取所有氛围值
 */
export async function fetchAllMoods(): Promise<string[]> {
  const { data } = await supabaseAnon
    .from("wi_entries")
    .select("mood")
    .not("mood", "is", null);

  if (!data) return [];
  const set = new Set<string>();
  data.forEach((row: any) => {
    if (row.mood) set.add(row.mood);
  });
  return Array.from(set).sort();
}

/**
 * 获取所有类型
 */
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

/**
 * 获取标签总数和条目总数
 */
export async function fetchCounts(): Promise<{ entries: number; tags: number }> {
  const [{ count: entries }, { count: tags }] = await Promise.all([
    supabaseAnon.from("wi_entries").select("*", { count: "exact", head: true }),
    supabaseAnon.from("wi_tags").select("*", { count: "exact", head: true }),
  ]);
  return { entries: entries || 0, tags: tags || 0 };
}
