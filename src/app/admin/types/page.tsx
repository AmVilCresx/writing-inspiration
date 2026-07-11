import { verifyAdminCookie } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminTypeManager from "@/components/AdminTypeManager";
import { adminFetchTypes } from "@/data/admin";

export default async function TypesPage() {
  const admin = await verifyAdminCookie();
  if (!admin) redirect("/admin/login");

  const types = await adminFetchTypes();

  return <AdminTypeManager types={types} />;
}
