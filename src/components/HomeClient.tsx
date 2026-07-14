"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import type { Entry, Tag } from "@/lib/types";
import { TAG_COLORS } from "@/lib/colors";

const TYPE_COLORS = [
  "#e8f0e4", "#e4ecf0", "#f0ebe4", "#e8e4f0", "#f0e4ec",
  "#e4e8f0", "#f0e8e4", "#ebe4f0", "#e4f0e8", "#f0ebe8",
];

//  骨架屏尺寸（模拟随机药丸宽度）
const SKELETON_WIDTHS = [72, 96, 84, 64, 108, 76, 92, 68, 88, 74, 100, 80, 64, 96, 86, 70];

export default function HomeClient({
  types,
  featured,
  initialEntries,
  initialTotalPages,
  searchParams,
}: {
  types: { id: number; name: string }[];
  featured: Entry | null;
  initialEntries: Entry[];
  initialTotalPages: number;
  searchParams: { q: string; type: string; page: number };
}) {
  const router = useRouter();
  const searchParamsObj = useSearchParams();
  const [entries, setEntries] = useState(initialEntries);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [selected, setSelected] = useState<Entry | null>(featured);
  const [loading, setLoading] = useState(false);
  // 详情缓存——避免重复请求
  const detailCache = useRef<Map<number, Entry>>(new Map());

  const { q, type, page } = searchParams;

  // 同步 URL 与查询状态
  const syncUrl = useCallback((params: { q?: string; type?: string; page: number }) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.type) sp.set("type", params.type);
    if (params.page > 1) sp.set("page", String(params.page));
    const target = sp.toString() ? "?" + sp.toString() : "/";
    router.replace(target, { scroll: false });
  }, [router]);

  const fetchEntries = async (params: { q?: string; type?: string; page: number }) => {
    setLoading(true);
    syncUrl(params);
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.type) sp.set("type", params.type);
    sp.set("page", String(params.page));
    const res = await fetch(`/api/entries?${sp.toString()}`);
    const data = await res.json();
    setEntries(data.entries);
    setTotalPages(data.totalPages);
    if (data.entries.length > 0) {
      const first = data.entries[0];
      if (!selected || selected.id !== first.id) {
        const cached = detailCache.current.get(first.id);
        if (cached) {
          setSelected(cached);
        } else {
          const detailRes = await fetch(`/api/entry/${first.id}`);
          const detail = await detailRes.json();
          detailCache.current.set(first.id, detail.entry);
          setSelected(detail.entry);
        }
      }
    }
    setLoading(false);
  };

  const handleSearch = (query: string) => {
    fetchEntries({ q: query, type, page: 1 });
  };

  const handleTypeFilter = (typeName: string) => {
    fetchEntries({ q, type: typeName, page: 1 });
  };

  const handleClearFilter = () => {
    fetchEntries({ q, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    fetchEntries({ q, type, page: newPage });
  };

  const handlePillClick = async (entry: Entry) => {
    const cached = detailCache.current.get(entry.id);
    if (cached) {
      setSelected(cached);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/entry/${entry.id}`);
    const data = await res.json();
    detailCache.current.set(entry.id, data.entry);
    setSelected(data.entry);
    setLoading(false);
  };

  return (
    <main>
      <header className="site-header">
        <h1>词林</h1>
        <p>遣词之源，落笔之林</p>
      </header>

      {/*  精选区 */}
      <div className="hero-spot-wrapper">
        {loading && !selected ? (
          <div className="hero-spot">
            <div style={{ width: 24, height: 24, border: "2px solid rgba(0,0,0,0.1)", borderTopColor: "var(--fg)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          </div>
        ) : selected ? (
          <div className={`hero-spot${loading ? " hero-loading" : ""}`} style={{ textAlign: "center" }}>
            <span className="hero-type">{selected.type}</span>
            <Link href={`/entry/${selected.id}`} className="hero-title">{selected.title}</Link>
            {selected.meaning && <div className="hero-meaning">{selected.meaning}</div>}
            {selected.source && <div className="hero-source">{selected.source}{selected.author && ` · ${selected.author}`}</div>}
            {selected.example && <div className="hero-example">"{selected.example}"</div>}
            {selected.tags && selected.tags.length > 0 && (
              <div className="tags-row">
                {selected.tags.map((t: Tag) => {
                  const color = TAG_COLORS[t.id % TAG_COLORS.length];
                  return (
                    <span key={t.id} style={{ fontSize: 12, padding: "3px 12px", borderRadius: 8, background: color.bg, color: color.fg, border: `1px solid ${color.bg}` }}>{t.name}</span>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <SearchBox defaultValue={q} onSearch={handleSearch} />

      <div className="tag-cloud" style={{ marginBottom: 10 }}>
        <Link href="/" className={`pill${!type ? " active" : ""}`} onClick={(e) => { e.preventDefault(); handleClearFilter(); }}>全部</Link>
        {types.map((t, i) => (
          <Link
            key={t.id}
            href={`?type=${t.name}`}
            className={`pill${type === t.name ? " active" : ""}${type && type !== t.name ? " inactive" : ""}`}
            style={{ background: type === t.name ? TYPE_COLORS[i % TYPE_COLORS.length] : undefined }}
            onClick={(e) => { e.preventDefault(); handleTypeFilter(t.name); }}
          >
            {t.name}
          </Link>
        ))}
      </div>

      {type && (
        <div className="clear-filter">
          <Link href="/" onClick={(e) => { e.preventDefault(); handleClearFilter(); }}>清除筛选</Link>
        </div>
      )}

      {/* 骨架屏 — 仅在搜索结果为空且加载中时展示 */}
      {entries.length === 0 ? loading ? (
        <div className="skeleton-pill-cloud">
          {SKELETON_WIDTHS.map((w, i) => (
            <div key={i} className="skeleton-pill" style={{ width: `${w}px` }} />
          ))}
        </div>
      ) : (
        <div className="empty">或许，换一种表达会遇见它。</div>
      ) : (
        <div className="pill-cloud">
          {entries.map((entry) => {
            const typeIndex = types.findIndex((t) => t.name === entry.type);
            return (
              <a
                key={entry.id}
                href={`/entry/${entry.id}`}
                className={`has-tooltip${selected?.id === entry.id ? " selected" : ""}`}
                style={{ background: TYPE_COLORS[typeIndex % TYPE_COLORS.length] || "#e8e8ed" }}
                onClick={(e) => { e.preventDefault(); handlePillClick(entry); }}
              >
                {entry.title}
                {entry.source && <span className="pill-source">{entry.source}</span>}
                {entry.meaning && <span className="tooltip">{entry.meaning}</span>}
              </a>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          {page > 1 && <a href={`?page=${page - 1}`} onClick={(e) => { e.preventDefault(); handlePageChange(page - 1); }}>← 上一页</a>}
          {page < totalPages && <a href={`?page=${page + 1}`} onClick={(e) => { e.preventDefault(); handlePageChange(page + 1); }}>下一页 →</a>}
        </div>
      )}
    </main>
  );
}
