"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/", label: "Mapa", icon: MapIcon },
  { href: "/missions", label: "Misiones", icon: MissionsIcon },
  { href: "/fleet", label: "Flota", icon: FleetIcon },
  { href: "/compliance", label: "Compliance", icon: ComplianceIcon },
  { href: "/analytics", label: "Analytics", icon: AnalyticsIcon },
] as const;

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
              <Icon active={active} />
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
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
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
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
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
        <svg className="h-5 w-5 text-gray-700 dark:text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
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
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

/* --- Nav icons --- */

function MapIcon({ active }: { active: boolean }) {
  const color = active ? "text-blue-600 dark:text-blue-400" : "text-gray-400";
  return (
    <svg className={`h-4 w-4 ${color}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
    </svg>
  );
}

function MissionsIcon({ active }: { active: boolean }) {
  const color = active ? "text-blue-600 dark:text-blue-400" : "text-gray-400";
  return (
    <svg className={`h-4 w-4 ${color}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  );
}

function FleetIcon({ active }: { active: boolean }) {
  const color = active ? "text-blue-600 dark:text-blue-400" : "text-gray-400";
  return (
    <svg className={`h-4 w-4 ${color}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}

function ComplianceIcon({ active }: { active: boolean }) {
  const color = active ? "text-blue-600 dark:text-blue-400" : "text-gray-400";
  return (
    <svg className={`h-4 w-4 ${color}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function AnalyticsIcon({ active }: { active: boolean }) {
  const color = active ? "text-blue-600 dark:text-blue-400" : "text-gray-400";
  return (
    <svg className={`h-4 w-4 ${color}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}
