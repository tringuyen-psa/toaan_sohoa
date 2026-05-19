"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, FileText, Users, FolderTree, BarChart3, LogIn } from "lucide-react";

export function Header() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-[#1e3a8a] text-lg">
            QT Năng suất Số hóa
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link href="/" className="px-3 py-1.5 rounded hover:bg-slate-100">
              Dashboard
            </Link>
            {user && (
              <Link href="/entries" className="px-3 py-1.5 rounded hover:bg-slate-100 inline-flex items-center gap-1">
                <FileText className="h-4 w-4" /> Nhập liệu
              </Link>
            )}
            {isAdmin && (
              <>
                <Link href="/admin/users" className="px-3 py-1.5 rounded hover:bg-slate-100 inline-flex items-center gap-1">
                  <Users className="h-4 w-4" /> Người dùng
                </Link>
                <Link href="/admin/document-types" className="px-3 py-1.5 rounded hover:bg-slate-100 inline-flex items-center gap-1">
                  <FolderTree className="h-4 w-4" /> Loại hồ sơ
                </Link>
                <Link href="/admin/reports" className="px-3 py-1.5 rounded hover:bg-slate-100 inline-flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" /> Báo cáo
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {status === "loading" ? null : user ? (
            <>
              <span className="text-sm text-slate-600 hidden sm:inline">
                {user.name} {isAdmin && <span className="text-xs text-amber-600">(admin)</span>}
              </span>
              <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
                <LogOut className="h-4 w-4 mr-1" /> Đăng xuất
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">
                <LogIn className="h-4 w-4 mr-1" /> Đăng nhập
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
