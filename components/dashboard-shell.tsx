"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode, MouseEvent, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import { UserRole } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/assets", label: "Assets", icon: "🏭" },
  { href: "/dashboard/work-orders", label: "Work Orders", icon: "📋" },
  { href: "/dashboard/preventive", label: "Preventive", icon: "🔧" },
  { href: "/dashboard/inventory", label: "Inventory", icon: "📦" },
  { href: "/dashboard/purchase-orders", label: "Purchase Orders", icon: "🛒" },
  { href: "/dashboard/compliance", label: "Compliance", icon: "✅" },
  { href: "/dashboard/meters", label: "Meters", icon: "📊" },
  { href: "/dashboard/documents", label: "Documents", icon: "📄" },
  { href: "/dashboard/maintenance-history", label: "History", icon: "📜" },
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
  const [pendingHref, setPendingHref] = useState<string | null>(null);

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

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  function handleNavClick(href: string, event: MouseEvent<HTMLAnchorElement>) {
    if (
      href === pathname ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    setPendingHref(href);
  }

  const isNavigating = Boolean(pendingHref && pendingHref !== pathname);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
      <div className="grid grid-cols-1 gap-0 md:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="border-r border-slate-700/60 bg-slate-900/95 text-white backdrop-blur md:min-h-screen">
          <div className="p-6 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Asset Ops Logo"
              width={180}
              height={180}
              className="h-40 w-40"
              priority
            />
          </div>

          <nav className="space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const isPending = pendingHref === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(event) => handleNavClick(item.href, event)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {isPending ? (
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
                    />
                  ) : null}
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
              <FormSubmitButton
                type="submit"
                pendingText="Signing Out..."
                className="w-full rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Sign Out
              </FormSubmitButton>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <main className="p-4 md:p-8">
          {isNavigating ? (
            <div className="mb-4 overflow-hidden rounded-full bg-slate-800/70">
              <div className="h-1 w-full origin-left animate-pulse bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500" />
            </div>
          ) : null}
          {/* Top bar */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="text-sm font-medium text-slate-200/80">
              {isNavigating ? "Loading page..." : ""}
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/notifications"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800/70 text-slate-200 hover:bg-slate-700/70 transition"
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
          <div className="rounded-2xl border border-slate-300/60 bg-slate-100/95 shadow-2xl backdrop-blur p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
