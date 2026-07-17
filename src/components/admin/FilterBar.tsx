"use client";

import MultiSelect from "@/components/MultiSelect";
import type { AdminTag, AdminType } from "@/lib/types";
import type { AdminFetchFilters } from "@/data/admin";

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

export default function AdminFilterBar({
  filterQ,
  filterTypes,
  filterTags,
  filterStatuses,
  types,
  tags,
  total,
  page,
  pageSize,
  hasFilters,
  onFilterQChange,
  onFilterTypesChange,
  onFilterTagsChange,
  onFilterStatusesChange,
  onTriggerSearch,
  onDebouncedApply,
  onResetFilters,
}: {
  filterQ: string;
  filterTypes: string[];
  filterTags: string[];
  filterStatuses: ("visible" | "hidden")[];
  types: AdminType[];
  tags: AdminTag[];
  total: number;
  page: number;
  pageSize: number;
  hasFilters: boolean;
  onFilterQChange: (v: string) => void;
  onFilterTypesChange: (v: string[]) => void;
  onFilterTagsChange: (v: string[]) => void;
  onFilterStatusesChange: (v: ("visible" | "hidden")[]) => void;
  onTriggerSearch: () => void;
  onDebouncedApply: (filters: AdminFetchFilters) => void;
  onResetFilters: () => void;
}) {
  const tagMap = new Map(tags.map((t) => [t.id, t.name]));

  return (
    <>
      {/* 搜索行 */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 240px", minWidth: 160 }}>
          <input
            placeholder="搜索标题 / 释义 / 出处 / 作者 / 例句"
            value={filterQ}
            onChange={(e) => onFilterQChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onTriggerSearch(); }}
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
            onClick={onTriggerSearch}
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

        <MultiSelect
          values={filterTypes}
          onChange={(v) => {
            onFilterTypesChange(v);
            onDebouncedApply({ q: filterQ.trim() || undefined, types: v, tagIds: filterTags.map(Number), statuses: filterStatuses });
          }}
          placeholder="全部类型"
          options={types.map((t) => ({ value: t.name, label: t.name }))}
        />
        <MultiSelect
          values={filterTags}
          onChange={(v) => {
            onFilterTagsChange(v);
            onDebouncedApply({ q: filterQ.trim() || undefined, types: filterTypes, tagIds: v.map(Number), statuses: filterStatuses });
          }}
          placeholder="全部标签"
          options={tags.map((t) => ({ value: String(t.id), label: t.name }))}
        />
        <MultiSelect
          values={filterStatuses}
          onChange={(v) => {
            const arr = v.filter((x): x is "visible" | "hidden" => x === "visible" || x === "hidden");
            onFilterStatusesChange(arr);
            onDebouncedApply({ q: filterQ.trim() || undefined, types: filterTypes, tagIds: filterTags.map(Number), statuses: arr });
          }}
          placeholder="全部状态"
          options={[
            { value: "visible", label: "已发布" },
            { value: "hidden", label: "已隐藏" },
          ]}
        />
        {hasFilters && (
          <button onClick={onResetFilters} style={{ padding: "8px 14px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.45)", fontSize: 13, color: "var(--fg-muted)", cursor: "pointer", borderRadius: 10, fontFamily: "inherit", backdropFilter: "blur(8px)", boxShadow: "var(--shadow-sm)", transition: "all 0.2s" }}>重置</button>
        )}
      </div>

      {/* 已选中条件 chips */}
      {hasFilters && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {filterQ && (
            <Chip onRemove={() => { onFilterQChange(""); onDebouncedApply({ q: undefined, types: filterTypes, tagIds: filterTags.map(Number), statuses: filterStatuses }); }}>
              搜索：{filterQ}
            </Chip>
          )}
          {filterTypes.length > 0 && (
            <Chip onRemove={() => { onFilterTypesChange([]); onDebouncedApply({ q: filterQ.trim() || undefined, types: [], tagIds: filterTags.map(Number), statuses: filterStatuses }); }}>
              类型：{filterTypes.join("、")}
            </Chip>
          )}
          {filterTags.length > 0 && (
            <Chip onRemove={() => { onFilterTagsChange([]); onDebouncedApply({ q: filterQ.trim() || undefined, types: filterTypes, tagIds: [], statuses: filterStatuses }); }}>
              标签：{filterTags.map((id) => tagMap.get(Number(id)) ?? id).join("、")}
            </Chip>
          )}
          {filterStatuses.length > 0 && (
            <Chip onRemove={() => { onFilterStatusesChange([]); onDebouncedApply({ q: filterQ.trim() || undefined, types: filterTypes, tagIds: filterTags.map(Number), statuses: [] }); }}>
              状态：{filterStatuses.map((s) => (s === "visible" ? "已发布" : "已隐藏")).join("、")}
            </Chip>
          )}
        </div>
      )}

      {/* 计数行 */}
      <div style={{ fontSize: 13, color: "var(--fg-muted)", margin: "-4px 0 16px" }}>
        共 {total} 条{total > 0 && <span> · 第 {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} 条</span>}
      </div>
    </>
  );
}
