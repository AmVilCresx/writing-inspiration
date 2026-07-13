import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";

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
        <ErrorBoundary>
          <div className="page-wrapper">
            <div className="page-content">{children}</div>
            <Footer />
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}