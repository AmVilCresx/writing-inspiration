import { redirect } from "next/navigation";
import { verifyAdminCookie } from "@/lib/auth";
import AdminEntryList from "@/components/AdminEntryList";
import AdminTagManager from "@/components/AdminTagManager";
import AdminTypeManager from "@/components/AdminTypeManager";
import UserMenu from "@/components/UserMenu";
import { adminFetchEntries, adminFetchTags, adminFetchTypes } from "@/data/admin";

export default async function AdminPage() {
  const admin = verifyAdminCookie();
  if (!admin) redirect("/admin/login");

  const [entries, tags, types] = await Promise.all([
    adminFetchEntries(),
    adminFetchTags(),
    adminFetchTypes(),
  ]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: "var(--fg)", letterSpacing: 0.02 }}>管理后台</h1>
          <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: "4px 0 0" }}>共 {entries.length} 条素材</p>
        </div>
        <UserMenu email={admin.email} />
      </div>

      <AdminEntryList entries={entries} tags={tags} types={types} />
      <AdminTypeManager types={types} />
      <AdminTagManager tags={tags} />
    </>
  );
}
