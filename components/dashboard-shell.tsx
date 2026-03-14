"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { UserRole } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/assets", label: "Assets", icon: "🏭" },
  { href: "/dashboard/work-orders", label: "Work Orders", icon: "📋" },
  { href: "/dashboard/preventive", label: "Preventive", icon: "🔧" },
  { href: "/dashboard/inventory", label: "Inventory", icon: "📦" },
  { href: "/dashboard/vendors", label: "Vendors", icon: "🤝" },
  { href: "/dashboard/reports", label: "Reports", icon: "📈" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export function DashboardShell({
  children,
  userName,
  role,
  signOutAction,
  unreadNotifications,
}: {
  children: ReactNode;
  userName: string;
  role: UserRole;
  signOutAction: () => Promise<void>;
  unreadNotifications?: number;
}) {
  const pathname = usePathname();

  const roleDisplay: Record<UserRole, string> = {
    admin: "Administrator",
    maintenance_manager: "Maintenance Manager",
    technician: "Technician",
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid grid-cols-1 gap-0 md:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="border-r border-slate-200 bg-slate-900 text-white md:min-h-screen">
          <div className="p-5 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Asset Ops Logo"
              width={40}
              height={40}
              className="h-10 w-10"
              priority
            />
          </div>

          <nav className="space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{userName}</p>
                <p className="text-xs text-slate-400">{roleDisplay[role]}</p>
              </div>
            </div>
            <form action={signOutAction} className="mt-4">
              <button
                type="submit"
                className="w-full rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <main className="p-4 md:p-8">
          {/* Top bar */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <div></div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/notifications"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
              >
                <span className="text-lg">🔔</span>
                {unreadNotifications && unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Page Content */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
