"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/Modal";
import type { AdminEntry, AdminTag, AdminType } from "@/lib/types";
import type { AdminFetchFilters } from "@/data/admin";
import MultiSelect from "@/components/MultiSelect";
import { getTagColor } from "@/lib/colors";
import EntryForm from "@/components/admin/EntryForm";
import type { FormData } from "@/components/admin/EntryForm";

type ToastType = "success" | "error" | "info";

// 可移除条件 chip（毛玻璃风）
function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 6px 4px 12px",
        fontSize: 12,
        fontFamily: "inherit",
        color: "var(--fg)",
        background: "var(--pill-bg)",
        border: "1px solid var(--glass-border)",
        borderRadius: 12,
        backdropFilter: "blur(8px)",
      }}
    >
      {children}
      <button
        type="button"
        onClick={onRemove}
        title="移除"
        style={{
          border: "none",
          background: "none",
          color: "var(--fg-muted)",
          cursor: "pointer",
          padding: "0 2px",
          fontSize: 14,
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          width: 18,
          height: 18,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.08)"; e.currentTarget.style.color = "var(--fg)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--fg-muted)"; }}
      >
        ×
      </button>
    </span>
  );
}

export default function AdminEntryList({
  entries: initialEntries,
  tags,
  types,
  total: initialTotal,
  page: initialPage,
  pageSize,
  filters,
}: {
  entries: AdminEntry[];
  tags: AdminTag[];
  types: AdminType[];
  total: number;
  page: number;
  pageSize: number;
  filters: AdminFetchFilters;
}) {
  const router = useRouter();
  const { alert, confirm } = useModal();
  const [editing, setEditing] = useState<AdminEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [toastExiting, setToastExiting] = useState(false);

  // 条目 / 总数 / 页码：首屏由 SSR props 提供，后续由客户端 fetch 更新
  const [entries, setEntries] = useState(initialEntries);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const showToast = (msg: string, type: ToastType = "info") => {
    setToast({ msg, type });
    setToastExiting(false);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToastExiting(true);
      setTimeout(() => { setToast(null); setToastExiting(false); }, 300);
    }, 2000);
  };

  const withLoading = async (fn: () => Promise<boolean>, successMsg: string) => {
    setLoading(true);
    const ok = await fn();
    setLoading(false);
    if (ok) showToast(successMsg, "success");
    return ok;
  };

  // 客户端 fetch 条目列表（带 loading 遮罩 + URL 同步）；多选用重复键 ?type=a&type=b 方式
  const loadEntries = useCallback(
    async (next: { page: number } & AdminFetchFilters) => {
      await withLoading(async () => {
        const sp = new URLSearchParams();
        if (next.q) sp.set("q", next.q);
        next.types?.forEach((t) => sp.append("type", t));
        next.tagIds?.forEach((id) => sp.append("tag", String(id)));
        next.statuses?.forEach((s) => sp.append("status", s));
        if (next.page > 1) sp.set("page", String(next.page));
        const res = await fetch(`/api/admin/entries?${sp.toString()}`);
        if (!res.ok) throw new Error("加载失败");
        const data = await res.json();
        setEntries(data.entries);
        setTotal(data.total);
        setPage(data.page);
        const path = sp.toString() ? `/admin/entries?${sp.toString()}` : "/admin/entries";
        router.replace(path, { scroll: false });
        return true;
      }, "");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router],
  );

  const [form, setForm] = useState<FormData>({
    type: types[0]?.name || "成语",
    title: "",
    meaning: "",
    source: "",
    author: "",
    example: "",
    tagIds: [],
  });

  const resetForm = () => {
    setForm({ type: types[0]?.name || "成语", title: "", meaning: "", source: "", author: "", example: "", tagIds: [] });
  };

  // 筛选状态（多选类型 / 多选标签 / 多选状态 + 搜索关键词）
  const [filterQ, setFilterQ] = useState(filters.q || "");
  const [filterTypes, setFilterTypes] = useState<string[]>(filters.types ?? []);
  const [filterTags, setFilterTags] = useState<string[]>(filters.tagIds?.map(String) ?? []);
  const [filterStatuses, setFilterStatuses] = useState<("visible" | "hidden")[]>(filters.statuses ?? []);

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
    refreshCurrentView();
  };

  const handleToggleHidden = async (id: number, current: boolean) => {
    if (!current) {
      const ok = await confirm({ message: "隐藏后该条目将不在前台显示，确定？" });
      if (!ok) return;
    }
    const okFn = await withLoading(async () => {
      const res = await fetch("/api/admin/entry/hidden", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, hidden: !current }),
      });
      return res.ok;
    }, current ? "已取消隐藏" : "已隐藏");
    if (!okFn) { await alert({ message: "操作失败" }); return; }
    refreshCurrentView();
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ message: "确定删除该条目？此操作不可撤销。", danger: true });
    if (!ok) return;
    const success = await withLoading(async () => {
      const res = await fetch(`/api/admin/entry?id=${id}`, { method: "DELETE" });
      return res.ok;
    }, "已删除");
    if (!success) { await alert({ message: "删除失败" }); return; }
    refreshCurrentView();
  };

  // 应用筛选：多选下拉 / 搜索词统一收敛（会回第 1 页）
  const applyFilters = useCallback(
    (next: AdminFetchFilters) => loadEntries({ page: 1, ...next }),
    [loadEntries],
  );

  // 搜索按钮 / Enter：立即触发（不经防抖，明确意图优先）
  const triggerSearch = useCallback(
    () =>
      applyFilters({
        q: filterQ.trim() || undefined,
        types: filterTypes,
        tagIds: filterTags.map(Number),
        statuses: filterStatuses,
      }),
    [applyFilters, filterQ, filterTypes, filterTags, filterStatuses],
  );

  // 多选下拉：实时触发但经防抖（300ms），避免连勾连查
  const debouncedApplyRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const debouncedApply = useCallback(
    (next: AdminFetchFilters) => {
      clearTimeout(debouncedApplyRef.current);
      debouncedApplyRef.current = setTimeout(() => applyFilters(next), 500);
    },
    [applyFilters],
  );
  useEffect(() => () => clearTimeout(debouncedApplyRef.current), []);

  const goToPage = useCallback(
    (p: number) =>
      loadEntries({
        page: p,
        q: filterQ.trim() || undefined,
        types: filterTypes,
        tagIds: filterTags.map(Number),
        statuses: filterStatuses,
      }),
    [loadEntries, filterQ, filterTypes, filterTags, filterStatuses],
  );

  const resetFilters = useCallback(() => {
    setFilterQ("");
    setFilterTypes([]);
    setFilterTags([]);
    setFilterStatuses([]);
    applyFilters({});
  }, [applyFilters]);

  // 变更（新增/删除/隐藏）后：用当前视图重新 fetch，保留当前页与筛选
  const refreshCurrentView = useCallback(
    () =>
      loadEntries({
        page,
        q: filterQ.trim() || undefined,
        types: filterTypes,
        tagIds: filterTags.map(Number),
        statuses: filterStatuses,
      }),
    [loadEntries, page, filterQ, filterTypes, filterTags, filterStatuses],
  );

  const hasFilters = !!(filterQ || filterTypes.length || filterTags.length || filterStatuses.length);

  const tagMap = new Map(tags.map((t) => [t.id, t.name]));
  const loadingOverlay = loading && (
    <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.3)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, borderRadius: 16 }}>
      <div style={{ width: 24, height: 24, border: "2px solid rgba(0,0,0,0.1)", borderTopColor: "var(--fg)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    </div>
  );

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
          padding: "10px 28px", borderRadius: 12, fontSize: 13, fontWeight: 500, pointerEvents: "none",
          background: toast.type === "success" ? "#e8f5e9" : toast.type === "error" ? "#ffebee" : "rgba(255,255,255,0.8)",
          color: toast.type === "success" ? "#2e7d32" : toast.type === "error" ? "#c62828" : "var(--fg)",
          border: "1px solid rgba(255,255,255,0.6)", backdropFilter: "blur(16px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          animation: toastExiting ? "toastSlideUp 0.3s ease forwards" : "toastSlideDown 0.3s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* 标题和新增按钮 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)", margin: 0 }}>条目管理</h1>
        {!showForm && (
          <button onClick={openAdd}
            style={{ padding: "8px 20px", border: "none", background: "var(--fg)", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 10 }}>
            + 新增
          </button>
        )}
      </div>

      {/* 筛选区 */}
      {!showForm && (
        <>
          {/* 搜索行：输入框 + 内置放大镜图标（与前台一致），Enter 立即搜索 */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1 1 240px", minWidth: 160 }}>
              <input
                placeholder="搜索标题 / 释义 / 出处 / 作者 / 例句"
                value={filterQ}
                onChange={(e) => setFilterQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") triggerSearch(); }}
                style={{
                  width: "100%",
                  padding: "8px 40px 8px 14px",
                  border: "1px solid var(--glass-border)",
                  background: "var(--glass-bg-strong)",
                  fontSize: 13,
                  outline: "none",
                  borderRadius: 10,
                  color: "var(--fg)",
                  fontFamily: "inherit",
                  backdropFilter: "blur(16px)",
                  boxShadow: "var(--shadow-sm)",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={triggerSearch}
                title="搜索"
                style={{
                  position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                  border: "none", background: "none", color: "var(--fg-muted)",
                  cursor: "pointer", width: 28, height: 28,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 8, transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fg)"; e.currentTarget.style.background = "rgba(255,255,255,0.75)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-muted)"; e.currentTarget.style.background = "none"; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            </div>

            {/* 多选下拉：更改后防抖触发 */}
            <MultiSelect
              values={filterTypes}
              onChange={(v) => {
                setFilterTypes(v);
                debouncedApply({ q: filterQ.trim() || undefined, types: v, tagIds: filterTags.map(Number), statuses: filterStatuses });
              }}
              placeholder="全部类型"
              options={types.map((t) => ({ value: t.name, label: t.name }))}
            />
            <MultiSelect
              values={filterTags}
              onChange={(v) => {
                setFilterTags(v);
                debouncedApply({ q: filterQ.trim() || undefined, types: filterTypes, tagIds: v.map(Number), statuses: filterStatuses });
              }}
              placeholder="全部标签"
              options={tags.map((t) => ({ value: String(t.id), label: t.name }))}
            />
            <MultiSelect
              values={filterStatuses}
              onChange={(v) => {
                const arr = v.filter((x): x is "visible" | "hidden" => x === "visible" || x === "hidden");
                setFilterStatuses(arr);
                debouncedApply({ q: filterQ.trim() || undefined, types: filterTypes, tagIds: filterTags.map(Number), statuses: arr });
              }}
              placeholder="全部状态"
              options={[
                { value: "visible", label: "已发布" },
                { value: "hidden", label: "已隐藏" },
              ]}
            />
            {hasFilters && (
              <button onClick={resetFilters} style={{ padding: "8px 14px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.45)", fontSize: 13, color: "var(--fg-muted)", cursor: "pointer", borderRadius: 10, fontFamily: "inherit", backdropFilter: "blur(8px)", boxShadow: "var(--shadow-sm)", transition: "all 0.2s" }}>重置</button>
            )}
          </div>

          {/* 已选中条件 chips：同维度一个药丸（× 移除后防抖自动应用） */}
          {hasFilters && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {filterQ && (
                <Chip onRemove={() => { setFilterQ(""); debouncedApply({ q: undefined, types: filterTypes, tagIds: filterTags.map(Number), statuses: filterStatuses }); }}>
                  搜索：{filterQ}
                </Chip>
              )}
              {filterTypes.length > 0 && (
                <Chip onRemove={() => { setFilterTypes([]); debouncedApply({ q: filterQ.trim() || undefined, types: [], tagIds: filterTags.map(Number), statuses: filterStatuses }); }}>
                  类型：{filterTypes.join("、")}
                </Chip>
              )}
              {filterTags.length > 0 && (
                <Chip onRemove={() => { setFilterTags([]); debouncedApply({ q: filterQ.trim() || undefined, types: filterTypes, tagIds: [], statuses: filterStatuses }); }}>
                  标签：{filterTags.map((id) => tagMap.get(Number(id)) ?? id).join("、")}
                </Chip>
              )}
              {filterStatuses.length > 0 && (
                <Chip onRemove={() => { setFilterStatuses([]); debouncedApply({ q: filterQ.trim() || undefined, types: filterTypes, tagIds: filterTags.map(Number), statuses: [] }); }}>
                  状态：{filterStatuses.map((s) => (s === "visible" ? "已发布" : "已隐藏")).join("、")}
                </Chip>
              )}
            </div>
          )}

          {/* 计数行：total 来自数据库层 count 查询 */}
          <div style={{ fontSize: 13, color: "var(--fg-muted)", margin: "-4px 0 16px" }}>
            共 {total} 条{entries.length > 0 && <span> · 第 {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} 条</span>}
          </div>
        </>
      )}

      {/* 条目列表 */}
      <div style={{ position: "relative" }}>
        {/* 遮罩层位于 position: relative 容器内，能盖住列表 */}
        {loadingOverlay}
        <div style={{ background: "rgba(255,255,255,0.3)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.4)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
          {entries.length === 0 ? (
            <div className="empty">没有符合条件的条目</div>
          ) : (
            entries.map((entry, i) => (
              <div key={entry.id} style={{
                padding: "16px 20px", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.4)" : "none",
                display: "grid", gridTemplateColumns: "1fr auto", gap: "0 24px", alignItems: "start",
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
                        return (<span key={tid} style={{ fontSize: 11, padding: "2px 10px", borderRadius: 10, background: color.bg, color: color.fg, border: `1px solid ${color.bg}` }}>{tagMap.get(tid) || tid}</span>);
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

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24 }}>
            <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
              style={{ padding: "6px 14px", border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.4)", fontSize: 13, color: "var(--fg)", borderRadius: 8, cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1, fontFamily: "inherit" }}>
              上一页
            </button>
            <span style={{ fontSize: 13, color: "var(--fg-dim)", minWidth: 60, textAlign: "center" }}>{page} / {totalPages}</span>
            <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages}
              style={{ padding: "6px 14px", border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.4)", fontSize: 13, color: "var(--fg)", borderRadius: 8, cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.4 : 1, fontFamily: "inherit" }}>
              下一页
            </button>
          </div>
        )}
      </div>
    </>
  );
}
