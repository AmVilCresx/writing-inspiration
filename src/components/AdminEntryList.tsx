"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/Modal";
import type { AdminEntry, AdminTag } from "@/data/admin";

export default function AdminEntryList({
  entries: initialEntries,
  tags: allTags,
}: {
  entries: AdminEntry[];
  tags: AdminTag[];
}) {
  const router = useRouter();
  const { alert, confirm } = useModal();
  const [isPending, startTransition] = useTransition();
  const [entries, setEntries] = useState(initialEntries);
  const [editing, setEditing] = useState<AdminEntry | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    type: "成语" as string,
    title: "",
    meaning: "",
    source: "",
    author: "",
    example: "",
    mood: "",
    tagIds: [] as number[],
  });

  const resetForm = () => {
    setForm({ type: "成语", title: "", meaning: "", source: "", author: "", example: "", mood: "", tagIds: [] });
  };

  const openAdd = () => {
    resetForm();
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (entry: AdminEntry) => {
    setForm({
      type: entry.type,
      title: entry.title,
      meaning: entry.meaning || "",
      source: entry.source || "",
      author: entry.author || "",
      example: entry.example || "",
      mood: entry.mood || "",
      tagIds: entry.tagIds,
    });
    setEditing(entry);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { await alert({ message: "标题不能为空" }); return; }

    const body = JSON.stringify(editing ? { id: editing.id, ...form } : form);
    const method = editing ? "PUT" : "POST";

    const res = await fetch("/api/admin/entry", { method, headers: { "Content-Type": "application/json" }, body });
    if (!res.ok) { await alert({ message: "保存失败" }); return; }

    setShowForm(false);
    resetForm();
    startTransition(() => router.refresh());
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ message: "确认删除此条目？", danger: true });
    if (!ok) return;
    const res = await fetch(`/api/admin/entry?id=${id}`, { method: "DELETE" });
    if (!res.ok) { await alert({ message: "删除失败" }); return; }
    startTransition(() => router.refresh());
  };

  //  ── 表单 ──
  if (showForm) {
    const s: React.CSSProperties = { width: "100%", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.5)", fontFamily: "inherit", fontSize: 14, outline: "none", borderRadius: 10, marginBottom: 20, boxSizing: "border-box", color: "var(--fg)" };
    const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "var(--fg-dim)", marginBottom: 6, display: "block", letterSpacing: 0.04 };

    return (
      <form onSubmit={handleSave} style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 28, color: "var(--fg)" }}>{editing ? "编辑条目" : "新增条目"}</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
          <div>
            <label style={lbl}>类型</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={s}>
              {["成语", "名言", "俗语", "诗词", "歇后语"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>情感氛围</label>
            <input value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })} placeholder="如：励志、豪迈、讽刺" maxLength={20} style={s} />
          </div>
        </div>

        <label style={lbl}>标题 / 条目名</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={50} style={s} autoFocus />

        <label style={lbl}>释义</label>
        <textarea value={form.meaning} onChange={(e) => setForm({ ...form, meaning: e.target.value })} rows={3} maxLength={200} style={{ ...s, resize: "vertical" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
          <div>
            <label style={lbl}>出处</label>
            <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} maxLength={50} style={s} />
          </div>
          <div>
            <label style={lbl}>作者</label>
            <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} maxLength={32} style={s} />
          </div>
        </div>

        <label style={lbl}>例句</label>
        <textarea value={form.example} onChange={(e) => setForm({ ...form, example: e.target.value })} rows={2} maxLength={200} style={{ ...s, resize: "vertical" }} />

        <label style={lbl}>标签</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {allTags.map((tag) => (
            <label key={tag.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer", padding: "4px 12px", borderRadius: 14, background: form.tagIds.includes(tag.id) ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)", border: `1px solid ${form.tagIds.includes(tag.id) ? "rgba(120,180,255,0.4)" : "rgba(255,255,255,0.4)"}`, transition: "all 0.2s" }}>
              <input
                type="checkbox"
                checked={form.tagIds.includes(tag.id)}
                onChange={(e) => {
                  const ids = e.target.checked
                    ? [...form.tagIds, tag.id]
                    : form.tagIds.filter((id) => id !== tag.id);
                  setForm({ ...form, tagIds: ids });
                }}
                style={{ display: "none" }}
              />
              {tag.name}
            </label>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" disabled={isPending} style={{ padding: "10px 28px", border: "none", background: "var(--fg)", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 500, cursor: "pointer", borderRadius: 10, opacity: isPending ? 0.7 : 1 }}>
            {isPending ? "保存中..." : "保存"}
          </button>
          <button type="button" onClick={() => { setShowForm(false); resetForm(); }} style={{ padding: "10px 28px", border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.5)", fontFamily: "inherit", fontSize: 14, color: "var(--fg-dim)", cursor: "pointer", borderRadius: 10 }}>
            取消
          </button>
        </div>
      </form>
    );
  }

  //  ── 列表 ──
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>共 {entries.length} 条素材</p>
        <button onClick={openAdd} style={{ padding: "8px 20px", border: "none", background: "var(--fg)", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 10 }}>
          + 新增
        </button>
      </div>

      <div style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.5)", boxShadow: "var(--shadow-sm)" }}>
        {entries.map((entry, i) => (
          <div key={entry.id} style={{ padding: "16px 20px", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.4)" : "none", display: "grid", gridTemplateColumns: "1fr auto", gap: "0 24px", alignItems: "start" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4, color: "var(--fg)" }}>
                <span style={{ fontSize: 10, color: "var(--fg)", background: "rgba(255,255,255,0.6)", padding: "2px 8px", borderRadius: 6, marginRight: 8, letterSpacing: 0.06, border: "1px solid rgba(255,255,255,0.5)" }}>{entry.type}</span>
                {entry.title}
              </div>
              {entry.meaning && <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>{entry.source && <span>{entry.source} · </span>}{entry.meaning.slice(0, 60)}{entry.meaning.length > 60 ? "..." : ""}</div>}
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
              <button onClick={() => openEdit(entry)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-dim)", padding: 0, fontFamily: "inherit", fontWeight: 500 }}>编辑</button>
              <button onClick={() => handleDelete(entry.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ba5252", padding: 0, fontFamily: "inherit", fontWeight: 500 }}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
