"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "@/components/UserMenu";

//  导航项定义
const NAV = [
  { href: "/admin/entries", label: "条目管理", icon: "entries" },
  { href: "/admin/tags", label: "标签管理", icon: "tags" },
  { href: "/admin/types", label: "类型管理", icon: "types" },
];

function NavIcon({ type, active }: { type: string; active: boolean }) {
  const color = active ? "#1d1d1f" : "#86868b";
  const sw = active ? 2.2 : 1.8;
  switch (type) {
    case "entries":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
      );
    case "tags":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      );
    case "types":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* ── 左侧边栏 ── */}
      <aside style={{ width: 200, flexShrink: 0, background: "rgba(255,255,255,0.45)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRight: "1px solid rgba(255,255,255,0.5)", display: "flex", flexDirection: "column", padding: "24px 0" }}>
        {/* Logo */}
        <div style={{ padding: "0 24px 24px", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <span style={{ fontSize: 20, fontWeight: 600, color: "#4a7a5a" }}>词</span>
            <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", letterSpacing: "0.04em" }}>词林</span>
          </Link>
        </div>

        {/* 导航 */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: active ? 500 : 400,
                  color: active ? "var(--fg)" : "var(--fg-dim)",
                  background: active ? "rgba(255,255,255,0.6)" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.35)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <NavIcon type={item.icon} active={active} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 回到前台 */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, fontSize: 13, color: "var(--fg-muted)", textDecoration: "none", transition: "background 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.35)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
            回到前台
          </Link>
        </div>
      </aside>

      {/* ── 右侧内容区 ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* 顶栏 */}
        <header style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", background: "rgba(255,255,255,0.4)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.5)" }}>
          <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>
            {NAV.find((n) => n.href === pathname)?.label || "后台管理"}
          </span>
          <UserMenu email={email} />
        </header>

        {/* 页面内容 */}
        <main style={{ flex: 1, padding: "28px 32px 48px", overflow: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

