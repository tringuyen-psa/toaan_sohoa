import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "QT Năng suất Số hóa",
  description: "Quản trị năng suất số hóa hồ sơ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50">
        <Providers>
          <Header />
          <main className="container mx-auto py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
