"use client";

import type { AdminEntry } from "@/lib/types";
import { getTagColor } from "@/lib/colors";

export default function AdminEntryTable({
  entries,
  tagMap,
  loading,
  onEdit,
  onToggleHidden,
  onDelete,
}: {
  entries: AdminEntry[];
  tagMap: Map<number, string>;
  loading: boolean;
  onEdit: (entry: AdminEntry) => void;
  onToggleHidden: (id: number, hidden: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const loadingOverlay = loading && (
    <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.3)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, borderRadius: 16 }}>
      <div style={{ width: 24, height: 24, border: "2px solid rgba(0,0,0,0.1)", borderTopColor: "var(--fg)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ position: "relative" }}>
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
                <button onClick={() => onEdit(entry)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-dim)", padding: 0, fontFamily: "inherit", fontWeight: 500 }}>编辑</button>
                <button onClick={() => onToggleHidden(entry.id, entry.hidden)} style={{ background: "none", border: "none", cursor: "pointer", color: entry.hidden ? "#52a54b" : "#999", padding: 0, fontFamily: "inherit", fontWeight: 500 }}>
                  {entry.hidden ? "显示" : "隐藏"}
                </button>
                <button onClick={() => onDelete(entry.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ba5252", padding: 0, fontFamily: "inherit", fontWeight: 500 }}>删除</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
