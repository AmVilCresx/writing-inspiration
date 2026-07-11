"use client";

import { useState } from "react";

export default function SearchBox({ defaultValue, onSearch }: { defaultValue: string; onSearch?: (val: string) => void }) {
  const [val, setVal] = useState(defaultValue);

  const search = (v: string) => {
    if (onSearch) {
      onSearch(v);
    } else {
      // 降级：无回调时使用原生跳转
      const p = new URLSearchParams();
      if (v.trim()) p.set("q", v.trim());
      window.location.href = `/?${p.toString()}`;
    }
  };

  return (
    <div className="search-wrap">
      <span className="search-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </span>
      <input
        type="text"
        placeholder="今天想找一句什么？"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") search(val);
        }}
        autoFocus
      />
      <button
        onClick={() => search(val)}
        className="search-btn"
        title="搜索"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </button>
    </div>
  );
}
