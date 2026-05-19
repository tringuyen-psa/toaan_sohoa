"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  FileText,
  Users,
  FolderTree,
  BarChart3,
  LogIn,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { href: "/", label: "Nhập liệu", icon: FileText },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Người dùng", icon: Users, adminOnly: true },
  { href: "/admin/document-types", label: "Loại hồ sơ", icon: FolderTree, adminOnly: true },
  { href: "/admin/reports", label: "Báo cáo", icon: BarChart3, adminOnly: true },
];

export function Header() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAdmin = user?.role === "ADMIN";
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const visibleItems = NAV.filter((n) => !n.adminOnly || isAdmin);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between gap-3">
        <div className="flex items-center gap-3 md:gap-6 min-w-0">
          <button
            type="button"
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/" className="font-bold text-[#1e3a8a] text-base md:text-lg whitespace-nowrap">
            QT Năng suất Số hóa
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {visibleItems.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "px-3 py-1.5 rounded inline-flex items-center gap-1 hover:bg-slate-100",
                  pathname === it.href && "bg-slate-100 font-semibold text-[#1e3a8a]"
                )}
              >
                <it.icon className="h-4 w-4" /> {it.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {status === "loading" ? null : user ? (
            <>
              <span className="text-sm text-slate-600 hidden sm:inline truncate max-w-[140px]">
                {user.name} {isAdmin && <span className="text-xs text-amber-600">(admin)</span>}
              </span>
              <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
                <LogOut className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">
                <LogIn className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Đăng nhập</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t bg-white shadow-lg">
          <ul className="container mx-auto py-2 flex flex-col">
            {visibleItems.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-3 rounded hover:bg-slate-100 text-sm",
                    pathname === it.href && "bg-slate-100 font-semibold text-[#1e3a8a]"
                  )}
                >
                  <it.icon className="h-4 w-4" /> {it.label}
                </Link>
              </li>
            ))}
            {user && (
              <li className="px-3 py-2 text-xs text-slate-500 border-t mt-2">
                Đang đăng nhập: <strong>{user.name}</strong>
                {isAdmin && <span className="text-amber-600 ml-1">(admin)</span>}
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
