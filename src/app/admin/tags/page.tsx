import { verifyAdminCookie } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminTagManager from "@/components/AdminTagManager";
import { adminFetchTags } from "@/data/admin";

export default async function TagsPage() {
  const admin = verifyAdminCookie();
  if (!admin) redirect("/admin/login");

  const tags = await adminFetchTags();

  return <AdminTagManager tags={tags} />;
}
