"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/Modal";
import type { AdminEntry, AdminTag, AdminType } from "@/data/admin";
import { getTagColor } from "@/lib/colors";

type ToastType = "success" | "error" | "info";

//  ── 组件 ──
export default function AdminEntryList({
  entries: initialEntries,
  tags,
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
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // 同步 server 刷新后的数据
  useEffect(() => { setEntries(initialEntries); }, [initialEntries]);

  //  showToast 工具函数
  const [toastExiting, setToastExiting] = useState(false);
  const showToast = (msg: string, type: ToastType = "info") => {
    setToast({ msg, type });
    setToastExiting(false);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToastExiting(true);
      setTimeout(() => { setToast(null); setToastExiting(false); }, 300);
    }, 2000);
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
    tagIds: [] as number[],
  });

  //  筛选
  const [filterType, setFilterType] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");   // all | hidden | visible
  const [filterQ, setFilterQ] = useState("");

  const filteredEntries = entries.filter((e) => {
    if (filterType && e.type !== filterType) return false;
    if (filterTag && !e.tagIds.includes(Number(filterTag))) return false;
    if (filterStatus === "hidden" && !e.hidden) return false;
    if (filterStatus === "visible" && e.hidden) return false;
    if (filterQ && !e.title.includes(filterQ) && !(e.meaning || "").includes(filterQ)) return false;
    return true;
  });

  //  分页
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedEntries = filteredEntries.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  // 筛选或数据变化时重置到第一页
  useEffect(() => { setPage(1); }, [filteredEntries.length, filterType, filterTag, filterStatus, filterQ]);

  const resetForm = () => {
    setForm({ type: types[0]?.name || "成语", title: "", meaning: "", source: "", author: "", example: "", tagIds: [] });
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
  tags.forEach((t) => tagMap.set(t.id, t.name));

  //  ── 表单 ──
  if (showForm) {
    const s: React.CSSProperties = { width: "100%", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.5)", fontFamily: "inherit", fontSize: 14, outline: "none", borderRadius: 10, marginBottom: 20, boxSizing: "border-box", color: "var(--fg)", backdropFilter: "blur(8px)" };
    const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "var(--fg-dim)", marginBottom: 6, display: "block", letterSpacing: 0.04 };

    return (
      <form onSubmit={handleSave} style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 28, color: "var(--fg)" }}>{editing ? "编辑条目" : "新增条目"}</h2>

        <div>
          <label style={lbl}>类型</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={s}>
            {types.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
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

        <label style={lbl}>标签 <span style={{ color: "var(--fg-muted)", fontWeight: 400 }}>（最多 5 个，已选 {form.tagIds.length}/5）</span></label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {tags.map((tag) => {
            const selected = form.tagIds.includes(tag.id);
            const maxReached = form.tagIds.length >= 5 && !selected;
            return (
              <label key={tag.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, cursor: maxReached ? "not-allowed" : "pointer", padding: "5px 14px", borderRadius: 14, background: selected ? "var(--fg)" : "rgba(255,255,255,0.35)", color: selected ? "#fff" : "var(--fg)", border: `1px solid ${selected ? "var(--fg)" : "rgba(255,255,255,0.4)"}`, transition: "all 0.2s", fontWeight: selected ? 500 : 400, opacity: maxReached ? 0.4 : 1 }}>
                <input type="checkbox" checked={selected} disabled={maxReached} onChange={(e) => { const ids = e.target.checked ? [...form.tagIds, tag.id] : form.tagIds.filter((id) => id !== tag.id); setForm({ ...form, tagIds: ids }); }} style={{ display: "none" }} />
                {tag.name}
              </label>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" disabled={loading} style={{ padding: "10px 28px", border: "none", background: "var(--fg)", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", borderRadius: 10, opacity: loading ? 0.6 : 1 }}>{loading ? "保存中..." : "保存"}</button>
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
        <div
          style={{
            position: "fixed",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            padding: "12px 28px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 400,
            letterSpacing: "0.04em",
            color: toast.type === "success" ? "#2a7a3e" : toast.type === "error" ? "#a03030" : "#3a7a9a",
            background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
            border: "1px solid rgba(255,255,255,0.6)",
            animation: toastExiting ? "toastSlideUp 0.3s cubic-bezier(0.7, 0, 0.84, 1) forwards" : "toastSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {toast.type === "success" && <span style={{ marginRight: 8 }}>✓</span>}
          {toast.type === "error" && <span style={{ marginRight: 8 }}>✕</span>}
          {toast.type === "info" && <span style={{ marginRight: 8 }}>ℹ</span>}
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
            共 {filteredEntries.length} 条素材（{entries.filter((e) => e.hidden).length} 条已隐藏）
            {filteredEntries.length > PAGE_SIZE && <span> · 第 {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredEntries.length)} 条</span>}
          </p>
          <button onClick={openAdd} style={{ padding: "8px 20px", border: "none", background: "var(--fg)", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 10 }}>+ 新增</button>
        </div>

        {/*  筛选区 */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <input
            placeholder="搜索标题 / 释义"
            value={filterQ}
            onChange={(e) => setFilterQ(e.target.value)}
            style={{ flex: 1, minWidth: 160, padding: "8px 14px", border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.5)", fontSize: 13, outline: "none", borderRadius: 10, color: "var(--fg)", fontFamily: "inherit", backdropFilter: "blur(8px)" }}
          />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: "8px 14px", border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.5)", fontSize: 13, outline: "none", borderRadius: 10, color: "var(--fg)", fontFamily: "inherit", cursor: "pointer" }}>
            <option value="">全部类型</option>
            {types.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
          <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} style={{ padding: "8px 14px", border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.5)", fontSize: 13, outline: "none", borderRadius: 10, color: "var(--fg)", fontFamily: "inherit", cursor: "pointer" }}>
            <option value="">全部标签</option>
            {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "8px 14px", border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.5)", fontSize: 13, outline: "none", borderRadius: 10, color: "var(--fg)", fontFamily: "inherit", cursor: "pointer" }}>
            <option value="all">全部状态</option>
            <option value="visible">已发布</option>
            <option value="hidden">已隐藏</option>
          </select>
          {(filterQ || filterType || filterTag || filterStatus !== "all") && (
            <button onClick={() => { setFilterQ(""); setFilterType(""); setFilterTag(""); setFilterStatus("all"); }} style={{ padding: "8px 14px", border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.4)", fontSize: 13, color: "var(--fg-dim)", cursor: "pointer", borderRadius: 10, fontFamily: "inherit" }}>重置</button>
          )}
        </div>

        <div style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.5)", boxShadow: "var(--shadow-sm)" }}>
          {pagedEntries.length === 0 ? (
            <div className="empty">没有符合条件的条目</div>
          ) : (
            pagedEntries.map((entry, i) => (
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
          ))
        )}
        </div>

        {/*  分页控件 */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              style={{ padding: "6px 14px", border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.4)", fontSize: 13, color: "var(--fg)", borderRadius: 8, cursor: safePage <= 1 ? "not-allowed" : "pointer", opacity: safePage <= 1 ? 0.4 : 1, fontFamily: "inherit", transition: "all 0.2s" }}
            >
              上一页
            </button>
            <span style={{ fontSize: 13, color: "var(--fg-dim)", minWidth: 60, textAlign: "center" }}>
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              style={{ padding: "6px 14px", border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.4)", fontSize: 13, color: "var(--fg)", borderRadius: 8, cursor: safePage >= totalPages ? "not-allowed" : "pointer", opacity: safePage >= totalPages ? 0.4 : 1, fontFamily: "inherit", transition: "all 0.2s" }}
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </>
  );
}
