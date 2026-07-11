import { redirect } from "next/navigation";
import { verifyAdminCookie } from "@/lib/auth";
import { ModalProvider } from "@/components/Modal";
import AdminShell from "@/components/AdminShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = verifyAdminCookie();
  if (!admin) redirect("/admin/login");

  return (
    <ModalProvider>
      <AdminShell email={admin.email}>
        {children}
      </AdminShell>
    </ModalProvider>
  );
}
