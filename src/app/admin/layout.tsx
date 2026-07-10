import Link from "next/link";
import { ModalProvider } from "@/components/Modal";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModalProvider>
      <main style={{ width: "90%", maxWidth: 960, margin: "0 auto", padding: "48px 0 80px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 48 }}>
          <Link href="/" style={{ fontSize: 13, color: "var(--fg-muted)", letterSpacing: 0.04, textDecoration: "none" }}>
            ← 回到前台
          </Link>
        </header>
        {children}
      </main>
    </ModalProvider>
  );
}
