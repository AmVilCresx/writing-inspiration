import { verifyAdminCookie } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminEntryList from "@/components/AdminEntryList";
import { adminFetchEntries, adminFetchTags, adminFetchTypes } from "@/data/admin";

export default async function EntriesPage() {
  const admin = await verifyAdminCookie();
  if (!admin) redirect("/login");

  const [entries, tags, types] = await Promise.all([
    adminFetchEntries(),
    adminFetchTags(),
    adminFetchTypes(),
  ]);

  return <AdminEntryList entries={entries} tags={tags} types={types} />;
}
