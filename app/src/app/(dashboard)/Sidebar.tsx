"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import {
  MapIcon,
  MissionIcon,
  DroneIcon,
  ComplianceIcon,
  AnalyticsIcon,
  SunIcon,
  MoonIcon,
  LogOutIcon,
  MenuIcon,
  CloseIcon,
} from "@/lib/icons";
import type { LucideProps } from "@/lib/icons";
import type React from "react";

type NavIcon = React.ComponentType<LucideProps>;

const NAV_ITEMS: { href: string; label: string; icon: NavIcon }[] = [
  { href: "/", label: "Mapa", icon: MapIcon },
  { href: "/missions", label: "Misiones", icon: MissionIcon },
  { href: "/fleet", label: "Flota", icon: DroneIcon },
  { href: "/compliance", label: "Compliance", icon: ComplianceIcon },
  { href: "/analytics", label: "Analytics", icon: AnalyticsIcon },
];

export default function Sidebar({
  userName,
  userEmail,
  userRole,
}: {
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);

  // Sync with current html class on mount
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("opsmanager-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("opsmanager-theme", "light");
    }
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 dark:border-gray-700 px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-skypro360.png" alt="Skypro360" className="h-10 w-auto" />
        <span className="text-lg font-bold text-gray-900 dark:text-white">OpsManager</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Dark mode toggle */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <button
          onClick={toggleDark}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {dark ? (
            <SunIcon className="h-4 w-4" />
          ) : (
            <MoonIcon className="h-4 w-4" />
          )}
          <span>{dark ? "Modo claro" : "Modo oscuro"}</span>
        </button>
      </div>

      {/* User + logout */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">{userName}</p>
            <p className="truncate text-xs text-gray-400 dark:text-gray-500">{userEmail}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Cerrar sesion"
            className="ml-2 flex-shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600"
          >
            <LogOutIcon className="h-4 w-4" />
          </button>
        </div>
        {userRole && (
          <span className="mt-1.5 inline-block rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-medium uppercase text-gray-500 dark:text-gray-400">
            {userRole}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-md bg-white dark:bg-gray-800 p-2 shadow-md lg:hidden"
        aria-label="Abrir menu"
      >
        <MenuIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 shadow-xl" style={{ height: "100%" }}>
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Cerrar menu"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

