"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/Modal";
import type { AdminEntry, AdminTag, AdminType } from "@/data/admin";

//  ── 标签调色板 ──
const TAG_COLORS = [
  { bg: "rgba(220,235,250,0.6)", fg: "#3a6fa0" },
  { bg: "rgba(250,225,220,0.6)", fg: "#a05a3a" },
  { bg: "rgba(230,245,225,0.6)", fg: "#4a8a3a" },
  { bg: "rgba(245,230,250,0.6)", fg: "#8a4a9a" },
  { bg: "rgba(250,240,210,0.6)", fg: "#9a7a2a" },
  { bg: "rgba(220,245,240,0.6)", fg: "#3a8a7a" },
  { bg: "rgba(250,220,240,0.6)", fg: "#a03a8a" },
  { bg: "rgba(235,230,250,0.6)", fg: "#6a4aaa" },
];

function getTagColor(tagId: number) {
  return TAG_COLORS[tagId % TAG_COLORS.length];
}

type ToastType = "success" | "error" | "info";

//  ── 组件 ──
export default function AdminEntryList({
  entries: initialEntries,
  tags: allTags,
  types,
}: {
  entries: AdminEntry[];
  tags: AdminTag[];
  types: AdminType[];
}) {
  const router = useRouter();
  const { alert, confirm } = useModal();
  const [isPending, startTransition] = useTransition();
  const [entries, setEntries] = useState(initialEntries);
  const [editing, setEditing] = useState<AdminEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // 同步 server 刷新后的数据
  useEffect(() => { setEntries(initialEntries); }, [initialEntries]);

  //  showToast 工具函数
  const showToast = (msg: string, type: ToastType = "info") => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  };

  // 带 loading 的请求封装
  const withLoading = async (fn: () => Promise<boolean>, successMsg: string) => {
    setLoading(true);
    const ok = await fn();
    setLoading(false);
    if (ok) showToast(successMsg, "success");
    return ok;
  };

  const [form, setForm] = useState({
    type: types[0]?.name || "成语",
    title: "",
    meaning: "",
    source: "",
    author: "",
    example: "",
    mood: "",
    tagIds: [] as number[],
  });

  const resetForm = () => {
    setForm({ type: types[0]?.name || "成语", title: "", meaning: "", source: "", author: "", example: "", mood: "", tagIds: [] });
  };

  const openAdd = () => {
    resetForm();
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (entry: AdminEntry) => {
    setForm({
      type: types.find((t) => t.name === entry.type)?.name || types[0]?.name || entry.type,
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

    const ok = await withLoading(async () => {
      const res = await fetch("/api/admin/entry", { method, headers: { "Content-Type": "application/json" }, body });
      return res.ok;
    }, editing ? "修改成功" : "添加成功");

    if (!ok) { await alert({ message: "保存失败" }); return; }

    setShowForm(false);
    resetForm();
    startTransition(() => router.refresh());
  };

  const handleToggleHidden = async (id: number, current: boolean) => {
    if (!current) {
      const ok = await confirm({ message: "隐藏后该条目将不在前台显示，确定？" });
      if (!ok) return;
    }
    const ok = await withLoading(async () => {
      const res = await fetch("/api/admin/entry/hidden", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, hidden: !current }),
      });
      return res.ok;
    }, current ? "已取消隐藏" : "已隐藏");
    if (!ok) { await alert({ message: "操作失败" }); return; }
    startTransition(() => router.refresh());
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ message: "确认删除此条目？", danger: true });
    if (!ok) return;
    const success = await withLoading(async () => {
      const res = await fetch(`/api/admin/entry?id=${id}`, { method: "DELETE" });
      return res.ok;
    }, "删除成功");
    if (!success) { await alert({ message: "删除失败" }); return; }
    startTransition(() => router.refresh());
  };

  //  ── 获取所有标签名称（用于展示） ──
  const tagMap = new Map<number, string>();
  allTags.forEach((t) => tagMap.set(t.id, t.name));

  //  ── 表单 ──
  if (showForm) {
    const s: React.CSSProperties = { width: "100%", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.5)", fontFamily: "inherit", fontSize: 14, outline: "none", borderRadius: 10, marginBottom: 20, boxSizing: "border-box", color: "var(--fg)", backdropFilter: "blur(8px)" };
    const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "var(--fg-dim)", marginBottom: 6, display: "block", letterSpacing: 0.04 };

    return (
      <form onSubmit={handleSave} style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 28, color: "var(--fg)" }}>{editing ? "编辑条目" : "新增条目"}</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
          <div>
            <label style={lbl}>类型</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={s}>
              {types.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
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
            <label key={tag.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer", padding: "5px 14px", borderRadius: 14, background: form.tagIds.includes(tag.id) ? "var(--fg)" : "rgba(255,255,255,0.35)", color: form.tagIds.includes(tag.id) ? "#fff" : "var(--fg)", border: `1px solid ${form.tagIds.includes(tag.id) ? "var(--fg)" : "rgba(255,255,255,0.4)"}`, transition: "all 0.2s", fontWeight: form.tagIds.includes(tag.id) ? 500 : 400 }}>
              <input type="checkbox" checked={form.tagIds.includes(tag.id)} onChange={(e) => { const ids = e.target.checked ? [...form.tagIds, tag.id] : form.tagIds.filter((id) => id !== tag.id); setForm({ ...form, tagIds: ids }); }} style={{ display: "none" }} />
              {tag.name}
            </label>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" disabled={isPending} style={{ padding: "10px 28px", border: "none", background: "var(--fg)", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 500, cursor: "pointer", borderRadius: 10, opacity: isPending ? 0.7 : 1 }}>{isPending ? "保存中..." : "保存"}</button>
          <button type="button" onClick={() => { setShowForm(false); resetForm(); }} style={{ padding: "10px 28px", border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.5)", fontFamily: "inherit", fontSize: 14, color: "var(--fg-dim)", cursor: "pointer", borderRadius: 10 }}>取消</button>
        </div>
      </form>
    );
  }

  //  ── 列表 ──
  return (
    <>
      {/* Loading 遮罩 */}
      {loading && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(255,255,255,0.3)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid rgba(0,0,0,0.1)", borderTopColor: "var(--fg)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        </div>
      )}

      {/* Toast 提示 */}
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 1000, padding: "10px 24px", borderRadius: 12, fontSize: 14, fontWeight: 500, letterSpacing: "0.04em", color: toast.type === "success" ? "#3aaf5e" : toast.type === "error" ? "#c04040" : "#4a8ab0", background: "none", animation: "fadeDown 0.3s ease" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>共 {entries.length} 条素材（{entries.filter((e) => e.hidden).length} 条已隐藏）</p>
          <button onClick={openAdd} style={{ padding: "8px 20px", border: "none", background: "var(--fg)", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 10 }}>+ 新增</button>
        </div>

        <div style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.5)", boxShadow: "var(--shadow-sm)" }}>
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              style={{
                padding: "16px 20px",
                borderTop: i > 0 ? "1px solid rgba(255,255,255,0.4)" : "none",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "0 24px",
                alignItems: "start",
                transition: "all 0.2s ease",
                background: entry.hidden ? "rgba(255,230,230,0.25)" : "transparent",
                opacity: entry.hidden ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!entry.hidden) e.currentTarget.style.background = "rgba(255,255,255,0.5)";
                e.currentTarget.style.transform = "scale(1.01)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)";
                e.currentTarget.style.borderRadius = "12px";
                e.currentTarget.style.zIndex = "2";
                e.currentTarget.style.position = "relative";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = entry.hidden ? "rgba(255,230,230,0.25)" : "transparent";
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderRadius = "0";
                e.currentTarget.style.zIndex = "1";
                e.currentTarget.style.position = "relative";
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4, color: "var(--fg)" }}>
                  <span style={{ fontSize: 10, color: "var(--fg)", background: "rgba(255,255,255,0.6)", padding: "2px 8px", borderRadius: 6, marginRight: 8, letterSpacing: 0.06, border: "1px solid rgba(255,255,255,0.5)" }}>{entry.type}</span>
                  {entry.title}
                </div>
                {entry.tagIds.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
                    {entry.tagIds.map((tid) => {
                      const color = getTagColor(tid);
                      return (
                        <span key={tid} style={{ fontSize: 11, padding: "2px 10px", borderRadius: 10, background: color.bg, color: color.fg, border: `1px solid ${color.bg}` }}>
                          {tagMap.get(tid) || tid}
                        </span>
                      );
                    })}
                  </div>
                )}
                {entry.meaning && <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>{entry.source && <span>{entry.source} · </span>}{entry.meaning.slice(0, 60)}{entry.meaning.length > 60 ? "..." : ""}</div>}
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 13, whiteSpace: "nowrap" }}>
                <button onClick={() => openEdit(entry)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-dim)", padding: 0, fontFamily: "inherit", fontWeight: 500 }}>编辑</button>
                <button onClick={() => handleToggleHidden(entry.id, entry.hidden)} style={{ background: "none", border: "none", cursor: "pointer", color: entry.hidden ? "#52a54b" : "#999", padding: 0, fontFamily: "inherit", fontWeight: 500 }}>
                  {entry.hidden ? "显示" : "隐藏"}
                </button>
                <button onClick={() => handleDelete(entry.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ba5252", padding: 0, fontFamily: "inherit", fontWeight: 500 }}>删除</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
