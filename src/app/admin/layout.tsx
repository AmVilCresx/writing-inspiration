import { verifyAdminCookie } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ModalProvider } from "@/components/Modal";
import AdminShell from "@/components/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await verifyAdminCookie();
  if (!admin) {
    redirect("/login");
  }

  return (
    <ModalProvider>
      <AdminShell email={admin.email}>
        {children}
      </AdminShell>
    </ModalProvider>
  );
}
