import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import { fetchEntries } from "@/data/entries";

const PAGE_SIZE = 50;

const TYPE_COLORS: Record<string, string> = {
  "成语": "#e8f0e4",
  "名言": "#e4ecf0",
  "俗语": "#f0ebe4",
  "诗词": "#e8e4f0",
  "歇后语": "#f0e4ec",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; mood?: string; page?: string };
}) {
  const q = searchParams.q || "";
  const type = searchParams.type || "";
  const mood = searchParams.mood || "";
  const page = parseInt(searchParams.page || "1", 10);

  const filtered = await fetchEntries({
    query: q || undefined,
    type: type || undefined,
    mood: mood || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const qs = (params: Record<string, string>) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (type) p.set("type", type);
    if (mood) p.set("mood", mood);
    Object.entries(params).forEach(([k, v]) => p.set(k, v));
    return p.toString();
  };

  const baseHref = q ? `?q=${q}` : "/";

  return (
    <main>
      {/* 头部 */}
      <header className="site-header">
        <h1>词林</h1>
        <p>遣词之源，落笔之林</p>
      </header>

      {/* 搜索框 */}
      <SearchBox defaultValue={q} />

      {/* 分类标签（静态） */}
      <div className="tag-cloud" style={{ marginBottom: 10 }}>
        <Link href={baseHref} className={`pill${!type && !mood ? " active" : ""}`}>全部</Link>
        {["成语", "名言", "俗语", "诗词", "歇后语"].map((t) => (
          <Link
            key={t}
            href={`?${q ? `q=${q}&` : ""}type=${t}${mood ? `&mood=${mood}` : ""}`}
            className={`pill${type === t ? " active" : ""}${type && type !== t ? " inactive" : ""}`}
          >
            {t}
          </Link>
        ))}
      </div>

      {/* 清除筛选 */}
      {type && (
        <div className="clear-filter">
          <Link href={baseHref}>清除筛选</Link>
        </div>
      )}

      {/* 结果药丸 */}
      {filtered.length === 0 ? (
        <div className="empty">未找到相关内容</div>
      ) : (
        <div className="pill-cloud">
          {filtered.map((entry) => (
            <Link
              key={entry.id}
              href={`/entry/${entry.id}`}
              style={{ background: TYPE_COLORS[entry.type] || "#e8e8ed" }}
            >
              {entry.title}
              {entry.source && <span className="pill-source">{entry.source}</span>}
            </Link>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="pagination">
          {page > 1 && <Link href={`?${qs({ page: String(page - 1) })}`}>← 上一页</Link>}
          {page < totalPages && <Link href={`?${qs({ page: String(page + 1) })}`}>下一页 →</Link>}
        </div>
      )}
    </main>
  );
}
