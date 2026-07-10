import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "词林",
  description: "词林 — 成语、短语、名人名言，遣词之源，落笔之林",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        <div className="page-wrapper">
          <div className="page-content">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}