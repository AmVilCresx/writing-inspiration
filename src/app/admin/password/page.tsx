"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/Modal";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { alert } = useModal();
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPwd.length < 6) { setError("新密码至少 6 位"); return; }
    if (newPwd !== confirm) { setError("两次输入的新密码不一致"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "修改失败");
        return;
      }

      await alert({ message: "密码修改成功，请重新登录" });
      router.push("/admin/login");
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const s: React.CSSProperties = { width: "100%", padding: "11px 14px", border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.5)", fontFamily: "inherit", fontSize: 14, outline: "none", borderRadius: 10, marginBottom: 16, boxSizing: "border-box", color: "var(--fg)", backdropFilter: "blur(8px)" };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", paddingTop: 40 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 28px", color: "var(--fg)" }}>修改密码</h1>

      <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 16, padding: "32px 28px", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
        {error && (
          <div style={{ padding: "10px 14px", background: "rgba(255,230,230,0.6)", border: "1px solid rgba(255,180,180,0.4)", borderRadius: 10, fontSize: 13, color: "#cc3333", marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 12, fontWeight: 500, color: "var(--fg-dim)", marginBottom: 6, display: "block", letterSpacing: 0.04 }}>当前密码</label>
          <input type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} required autoFocus style={s} />

          <label style={{ fontSize: 12, fontWeight: 500, color: "var(--fg-dim)", marginBottom: 6, display: "block", letterSpacing: 0.04 }}>新密码</label>
          <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required minLength={6} style={s} />

          <label style={{ fontSize: 12, fontWeight: 500, color: "var(--fg-dim)", marginBottom: 6, display: "block", letterSpacing: 0.04 }}>确认新密码</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required style={{ ...s, marginBottom: 28 }} />

          <button type="submit" disabled={loading} style={{ width: "100%", padding: "11px 0", border: "none", background: "var(--fg)", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 500, cursor: loading ? "wait" : "pointer", borderRadius: 10, opacity: loading ? 0.7 : 1 }}>
            {loading ? "保存中..." : "确认修改"}
          </button>
        </form>
      </div>
    </div>
  );
}
