"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError("邮箱或密码错误");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const s: React.CSSProperties = { width: "100%", padding: "12px 16px", border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.5)", fontFamily: "inherit", fontSize: 15, outline: "none", borderRadius: 12, marginBottom: 16, boxSizing: "border-box", color: "var(--fg)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" };

  return (
    <div style={{ maxWidth: 360, margin: "100px auto", padding: "0 24px" }}>
      <Link href="/" style={{ fontSize: 13, color: "var(--fg-muted)", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 40, textDecoration: "none" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
        返回首页
      </Link>

      <div style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 24, padding: "40px 32px", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, textAlign: "center", color: "var(--fg)", margin: "0 0 8px" }}>管理员登录</h1>
        <p style={{ fontSize: 12, color: "var(--fg-muted)", textAlign: "center", margin: "0 0 32px" }}>词林后台</p>

        {error && (
          <div style={{ padding: "10px 14px", background: "rgba(255,230,230,0.6)", border: "1px solid rgba(255,180,180,0.4)", borderRadius: 10, fontSize: 13, color: "#cc3333", marginBottom: 16, backdropFilter: "blur(8px)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            style={s}
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ ...s, marginBottom: 24 }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "12px 0", border: "none", background: "var(--fg)", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 500, cursor: loading ? "wait" : "pointer", borderRadius: 12, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}
