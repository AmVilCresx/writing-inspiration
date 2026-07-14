"use client";

import { useEffect, useRef, useState } from "react";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
}

// 多选下拉：触发器 + 复选框面板，毛玻璃风。选中项由父组件以 chips 形式展示并可移除。
export default function MultiSelect({ values, onChange, options, placeholder }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (v: string) => {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else onChange([...values, v]);
  };

  const label =
    values.length === 0
      ? placeholder ?? "请选择"
      : values.length === 1
        ? options.find((o) => o.value === values[0])?.label ?? "已选 1 项"
        : `已选 ${values.length} 项`;

  return (
    <div ref={ref} style={{ position: "relative", minWidth: 120 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          padding: "8px 32px 8px 14px",
          border: "1px solid var(--glass-border)",
          background: "var(--glass-bg-strong)",
          fontSize: 13,
          color: values.length > 0 ? "var(--fg)" : "var(--fg-muted)",
          fontFamily: "inherit",
          textAlign: "left",
          cursor: "pointer",
          borderRadius: 10,
          outline: "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "var(--shadow-sm)",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
      >
        {label}
        <svg
          width="10" height="6" viewBox="0 0 10 6"
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: open ? "translateY(-50%) rotate(180deg)" : "translateY(-50%)",
            transition: "transform 0.18s ease",
            pointerEvents: "none",
          }}
        >
          <path d="M1 1l4 4 4-4" stroke="var(--fg-muted)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            zIndex: 50,
            top: "calc(100% + 6px)",
            left: 0,
            minWidth: "100%",
            maxHeight: 240,
            overflowY: "auto",
            padding: 4,
            border: "1px solid var(--glass-border)",
            background: "var(--glass-bg-strong)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 12,
            boxShadow: "var(--shadow)",
          }}
        >
          {options.length === 0 ? (
            <div style={{ padding: "8px 12px", fontSize: 13, color: "var(--fg-muted)" }}>无选项</div>
          ) : (
            options.map((opt) => {
              const on = values.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "rgba(0,0,0,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = on ? "var(--pill-active)" : "transparent"; }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "7px 12px",
                    border: "none",
                    borderRadius: 8,
                    background: on ? "var(--pill-active)" : "transparent",
                    color: "var(--fg)",
                    fontSize: 13,
                    fontFamily: "inherit",
                    textAlign: "left",
                    cursor: "pointer",
                    fontWeight: on ? 500 : 400,
                    transition: "background 0.15s",
                  }}
                >
                  {/* 仅选中时显示对号，未选中不留复选框 */}
                  {on && (
                    <span style={{ width: 16, flex: "0 0 16px", display: "flex", alignItems: "center", color: "var(--fg)" }}>
                      <svg width="12" height="10" viewBox="0 0 12 10">
                        <path d="M1 5l3.5 3.5L10.5 1" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                  {opt.label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
