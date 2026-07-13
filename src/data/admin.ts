import "server-only";
import { supabaseService } from "@/lib/supabase";
import type { AdminEntry, AdminTag, AdminType } from "@/lib/types";

//  ── 条目 CRUD ──

export async function adminFetchEntries(): Promise<AdminEntry[]> {
  const [{ data: entries, error: e1 }, { data: etRows, error: e2 }] = await Promise.all([
    supabaseService.from("wi_entries").select("*").order("updated_at", { ascending: false }),
    supabaseService.from("wi_entry_tags").select("entry_id, tag_id"),
  ]);

  if (e1) {
    console.error("adminFetchEntries error:", e1);
    return [];
  }

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
    hidden: row.hidden || false,
    tagIds: tagIdsByEntry.get(row.id) || [],
    updated_at: row.updated_at,
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

  // 替换标签关联
  const { data: oldRows } = await supabaseService
    .from("wi_entry_tags")
    .select("tag_id")
    .eq("entry_id", id);

  if (oldRows && oldRows.length > 0) {
    const toRemove = oldRows
      .map((r: any) => r.tag_id)
      .filter((tid: number) => !tagIds.includes(tid));
    if (toRemove.length > 0) {
      await supabaseService
        .from("wi_entry_tags")
        .delete()
        .eq("entry_id", id)
        .in("tag_id", toRemove);
    }
  }

  if (tagIds.length > 0) {
    const tagsToInsert = tagIds.map((tag_id: number) => ({ entry_id: id, tag_id }));
    const { error: insertErr } = await supabaseService
      .rpc("wi_upsert_entry_tags", { rows_json: JSON.stringify(tagsToInsert) });
    if (insertErr) {
      console.error("adminUpdateEntry tags insert error:", insertErr);
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
  const { error } = await supabaseService.from("wi_types").delete().eq("id", id);
  if (error) {
    console.error("adminDeleteType error:", error);
    return false;
  }
  return true;
}