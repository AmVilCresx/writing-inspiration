"use client";

import type { AdminTag, AdminType } from "@/lib/types";

export interface FormData {
  type: string;
  title: string;
  meaning: string;
  source: string;
  author: string;
  example: string;
  tagIds: number[];
}

export default function EntryForm({
  mode,
  types,
  tags,
  form,
  loading,
  onUpdate,
  onSave,
  onCancel,
}: {
  mode: "add" | "edit";
  types: AdminType[];
  tags: AdminTag[];
  form: FormData;
  loading: boolean;
  onUpdate: (data: FormData) => void;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  const s: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid rgba(255,255,255,0.4)",
    background: "rgba(255,255,255,0.5)",
    fontFamily: "inherit",
    fontSize: 14,
    outline: "none",
    borderRadius: 10,
    marginBottom: 20,
    boxSizing: "border-box",
    color: "var(--fg)",
    backdropFilter: "blur(8px)",
  };
  const lbl: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--fg-dim)",
    marginBottom: 6,
    display: "block",
    letterSpacing: 0.04,
  };

  return (
    <form onSubmit={onSave} style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 28, color: "var(--fg)" }}>
        {mode === "add" ? "新增条目" : "编辑条目"}
      </h2>

      <div>
        <label style={lbl}>类型</label>
        <select
          value={form.type}
          onChange={(e) => onUpdate({ ...form, type: e.target.value })}
          style={s}
        >
          {types.map((t) => (
            <option key={t.id} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <label style={lbl}>标题 / 条目名</label>
      <input
        value={form.title}
        onChange={(e) => onUpdate({ ...form, title: e.target.value })}
        maxLength={50}
        style={s}
        autoFocus
      />

      <label style={lbl}>释义</label>
      <textarea
        value={form.meaning}
        onChange={(e) => onUpdate({ ...form, meaning: e.target.value })}
        rows={3}
        maxLength={200}
        style={{ ...s, resize: "vertical" }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <div>
          <label style={lbl}>出处</label>
          <input
            value={form.source}
            onChange={(e) => onUpdate({ ...form, source: e.target.value })}
            maxLength={50}
            style={s}
          />
        </div>
        <div>
          <label style={lbl}>作者</label>
          <input
            value={form.author}
            onChange={(e) => onUpdate({ ...form, author: e.target.value })}
            maxLength={32}
            style={s}
          />
        </div>
      </div>

      <label style={lbl}>例句</label>
      <textarea
        value={form.example}
        onChange={(e) => onUpdate({ ...form, example: e.target.value })}
        rows={2}
        maxLength={200}
        style={{ ...s, resize: "vertical" }}
      />

      <label style={lbl}>
        标签{" "}
        <span style={{ color: "var(--fg-muted)", fontWeight: 400 }}>
          （最多 5 个，已选 {form.tagIds.length}/5）
        </span>
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {tags.map((tag) => {
          const selected = form.tagIds.includes(tag.id);
          const maxReached = form.tagIds.length >= 5 && !selected;
          return (
            <label
              key={tag.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 13,
                cursor: maxReached ? "not-allowed" : "pointer",
                padding: "5px 14px",
                borderRadius: 14,
                background: selected ? "var(--fg)" : "rgba(255,255,255,0.35)",
                color: selected ? "#fff" : "var(--fg)",
                border: `1px solid ${selected ? "var(--fg)" : "rgba(255,255,255,0.4)"}`,
                transition: "all 0.2s",
                fontWeight: selected ? 500 : 400,
                opacity: maxReached ? 0.4 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={selected}
                disabled={maxReached}
                onChange={(e) => {
                  const ids = e.target.checked
                    ? [...form.tagIds, tag.id]
                    : form.tagIds.filter((id) => id !== tag.id);
                  onUpdate({ ...form, tagIds: ids });
                }}
                style={{ display: "none" }}
              />
              {tag.name}
            </label>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 28px",
            border: "none",
            background: "var(--fg)",
            color: "#fff",
            fontFamily: "inherit",
            fontSize: 14,
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            borderRadius: 10,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "保存中..." : "保存"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "10px 28px",
            border: "1px solid rgba(0,0,0,0.08)",
            background: "rgba(255,255,255,0.5)",
            fontFamily: "inherit",
            fontSize: 14,
            color: "var(--fg-dim)",
            cursor: "pointer",
            borderRadius: 10,
          }}
        >
          取消
        </button>
      </div>
    </form>
  );
}