import "server-only";
import { supabaseService } from "@/lib/supabase";

//  条目类型
export interface AdminEntry {
  id: number;
  type: string;
  title: string;
  meaning: string | null;
  source: string | null;
  author: string | null;
  example: string | null;
  mood: string | null;
  tagIds: number[];
}

export interface AdminTag {
  id: number;
  name: string;
}

//  ──────────────────────────────────────────────
//  条目 CRUD
//  ──────────────────────────────────────────────

export async function adminFetchEntries(): Promise<AdminEntry[]> {
  const [{ data: entries, error: e1 }, { data: etRows, error: e2 }] = await Promise.all([
    supabaseService.from("wi_entries").select("*").order("id", { ascending: true }),
    supabaseService.from("wi_entry_tags").select("entry_id, tag_id"),
  ]);

  if (e1) {
    console.error("adminFetchEntries error:", e1);
    return [];
  }

  // 按 entry_id 分组 tag_id
  const tagIdsByEntry = new Map<number, number[]>();
  (etRows || []).forEach((row: any) => {
    const list = tagIdsByEntry.get(row.entry_id) || [];
    list.push(row.tag_id);
    tagIdsByEntry.set(row.entry_id, list);
  });

  return (entries || []).map((row: any) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    meaning: row.meaning,
    source: row.source,
    author: row.author,
    example: row.example,
    mood: row.mood,
    tagIds: tagIdsByEntry.get(row.id) || [],
  }));
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

  // 写入关联
  if (tagIds.length > 0) {
    await supabaseService.from("wi_entry_tags").insert(
      tagIds.map((tag_id) => ({ entry_id: data.id, tag_id }))
    );
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

  // 删除旧关联，写入新关联
  await supabaseService.from("wi_entry_tags").delete().eq("entry_id", id);
  if (tagIds.length > 0) {
    await supabaseService.from("wi_entry_tags").insert(
      tagIds.map((tag_id) => ({ entry_id: id, tag_id }))
    );
  }

  return true;
}

export async function adminDeleteEntry(id: number): Promise<boolean> {
  const { error } = await supabaseService.from("wi_entries").delete().eq("id", id);
  if (error) {
    console.error("adminDeleteEntry error:", error);
    return false;
  }
  return true;
}

//  ──────────────────────────────────────────────
//  标签管理
//  ──────────────────────────────────────────────

export async function adminFetchTags(): Promise<AdminTag[]> {
  const { data, error } = await supabaseService
    .from("wi_tags")
    .select("*")
    .order("name", { ascending: true });

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
  const { error } = await supabaseService.from("wi_tags").delete().eq("id", id);
  if (error) {
    console.error("adminDeleteTag error:", error);
    return false;
  }
  return true;
}
