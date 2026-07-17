"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/Modal";
import type { AdminEntry, AdminTag, AdminType } from "@/lib/types";
import type { AdminFetchFilters } from "@/data/admin";
import EntryForm from "@/components/admin/EntryForm";
import type { FormData } from "@/components/admin/EntryForm";
import AdminFilterBar from "@/components/admin/FilterBar";
import AdminEntryTable from "@/components/admin/EntryTable";

type ToastType = "success" | "error" | "info";

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

  // 客户端 fetch 条目列表（带 loading 遮罩 + URL 同步）
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

  // 筛选状态
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

  // 应用筛选（回到第 1 页）
  const applyFilters = useCallback(
    (next: AdminFetchFilters) => loadEntries({ page: 1, ...next }),
    [loadEntries],
  );

  // 搜索按钮 / Enter：立即触发
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

  // 多选下拉：防抖触发
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

      {/* 表单 or 筛选+列表 */}
      {showForm ? (
        <EntryForm
          mode={editing ? "edit" : "add"}
          types={types}
          tags={tags}
          form={form}
          loading={loading}
          onUpdate={setForm}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); resetForm(); }}
        />
      ) : (
        <>
          <AdminFilterBar
            filterQ={filterQ}
            filterTypes={filterTypes}
            filterTags={filterTags}
            filterStatuses={filterStatuses}
            types={types}
            tags={tags}
            total={total}
            page={page}
            pageSize={pageSize}
            hasFilters={hasFilters}
            onFilterQChange={setFilterQ}
            onFilterTypesChange={setFilterTypes}
            onFilterTagsChange={setFilterTags}
            onFilterStatusesChange={setFilterStatuses}
            onTriggerSearch={triggerSearch}
            onDebouncedApply={debouncedApply}
            onResetFilters={resetFilters}
          />

          <AdminEntryTable
            entries={entries}
            tagMap={tagMap}
            loading={loading}
            onEdit={openEdit}
            onToggleHidden={handleToggleHidden}
            onDelete={handleDelete}
          />

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
        </>
      )}
    </>
  );
}
