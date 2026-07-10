"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/Modal";
import type { AdminTag } from "@/data/admin";

export default function AdminTagManager({ tags }: { tags: AdminTag[] }) {
  const router = useRouter();
  const { alert, confirm } = useModal();
  const [isPending, startTransition] = useTransition();
  const [tagName, setTagName] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    const res = await fetch("/api/admin/tag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: tagName.trim() }),
    });

    if (!res.ok) { await alert({ message: "添加失败，标签可能已存在" }); return; }
    setTagName("");
    startTransition(() => router.refresh());
  };

  const handleDelete = async (id: number, name: string) => {
    const ok = await confirm({ message: `删除标签「${name}」？关联此标签的条目也会取消关联。`, danger: true });
    if (!ok) return;
    const res = await fetch(`/api/admin/tag?id=${id}`, { method: "DELETE" });
    if (!res.ok) { await alert({ message: "删除失败" }); return; }
    startTransition(() => router.refresh());
  };

  return (
    <div style={{ marginTop: 48 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: "var(--fg)" }}>标签管理</h2>

      <form onSubmit={handleAdd} style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          placeholder="新标签名"
          maxLength={20}
          style={{ flex: 1, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.5)", fontFamily: "inherit", fontSize: 14, outline: "none", borderRadius: 10, color: "var(--fg)" }}
        />
        <button type="submit" disabled={isPending} style={{ padding: "10px 24px", border: "none", background: "var(--fg)", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 500, cursor: "pointer", borderRadius: 10, opacity: isPending ? 0.7 : 1 }}>
          添加
        </button>
      </form>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {tags.map((tag) => (
          <span key={tag.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(255,255,255,0.5)", borderRadius: 16, fontSize: 13, border: "1px solid rgba(255,255,255,0.4)", color: "var(--fg)" }}>
            {tag.name}
            <button
              onClick={() => handleDelete(tag.id, tag.name)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-muted)", fontSize: 14, padding: 0, lineHeight: 1 }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
