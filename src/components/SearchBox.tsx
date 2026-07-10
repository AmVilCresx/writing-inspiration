"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBox({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const [val, setVal] = useState(defaultValue);

  const search = (v: string) => {
    const p = new URLSearchParams();
    if (v.trim()) p.set("q", v.trim());
    router.push(`/?${p.toString()}`);
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
        placeholder="搜索成语、名言、作者……"
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
