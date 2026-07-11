import Link from "next/link";
import { fetchEntryById, fetchRelated } from "@/data/entries";
import { notFound } from "next/navigation";
import { getTagColor } from "@/lib/colors";

export default async function EntryPage({
  params,
}: {
  params: { id: string };
}) {
  const entry = await fetchEntryById(params.id);

  if (!entry) return notFound();

  const related = await fetchRelated(entry);

  return (
    <div className="entry-page">
      <Link href="/" className="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
        返回首页
      </Link>

      <div className="glass-card">
        <h1>{entry.title}</h1>

        <div className="detail-meta">
          <span className="type-badge">{entry.type}</span>
          {entry.source && <span>{entry.source}</span>}
          {entry.author && <span> · {entry.author}</span>}
        </div>

        <div className="detail-body">
          {entry.meaning && <p className="content-quote">{entry.meaning}</p>}
          {entry.example && (
            <div className="detail-section">
              <div className="detail-label">例句</div>
              <p className="example-text">{entry.example}</p>
            </div>
          )}
        </div>

        {entry.tags.length > 0 && (
          <div className="related">
            <h2>标签</h2>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {entry.tags.map((t) => {
                const color = getTagColor(t.id);
                return (
                  <Link
                    key={t.id}
                    href={`/?tag=${t.name}`}
                    className="tag-link"
                    style={{ background: color.bg, color: color.fg, borderColor: color.bg }}
                  >
                    {t.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {related.length > 0 && (
          <div className="related">
            <h2>相关推荐</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {related.map((e) => (
                <li key={e.id} className="related-item">
                  <Link href={`/entry/${e.id}`}>{e.title}</Link>
                  <span className="type-tag">{e.type}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
