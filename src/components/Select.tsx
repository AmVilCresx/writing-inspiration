"use client";

import { useEffect, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

// 自定义下拉：触发器 + 展开面板都用毛玻璃风，替代原生 <select>（后者展开列表由 OS 渲染，无法与整体风格搭配）
export default function Select({ value, onChange, options, placeholder, className }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={className} style={{ position: "relative", minWidth: 110 }}>
      {/* 触发器 */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          padding: "8px 32px 8px 14px",
          border: "1px solid var(--glass-border)",
          background: "var(--glass-bg-strong)",
          fontSize: 13,
          color: selected ? "var(--fg)" : "var(--fg-muted)",
          fontFamily: "inherit",
          textAlign: "left",
          cursor: "pointer",
          borderRadius: 10,
          outline: "none",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "var(--shadow-sm)",
          appearance: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
      >
        {selected ? selected.label : placeholder ?? "请选择"}
        {/* 自定义下拉箭头（SVG，跟随 --fg-muted） */}
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
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

      {/* 展开面板 */}
      {open && (
        <div
          style={{
            position: "absolute",
            zIndex: 50,
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
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
          {options.map((opt) => {
            const isSel = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                onMouseEnter={(e) => { e.currentTarget.style.background = isSel ? "var(--pill-active)" : "rgba(0,0,0,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isSel ? "var(--pill-active)" : "transparent"; }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: 8,
                  background: isSel ? "var(--pill-active)" : "transparent",
                  color: "var(--fg)",
                  fontSize: 13,
                  fontFamily: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                  fontWeight: isSel ? 500 : 400,
                  transition: "background 0.15s",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
