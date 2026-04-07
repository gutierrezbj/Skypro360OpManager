"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  MapIcon,
  MissionIcon,
  DroneIcon,
  ComplianceIcon,
  AnalyticsIcon,
  LogOutIcon,
  MenuIcon,
  CloseIcon,
  SunIcon,
  MoonIcon,
} from "@/lib/icons";
import type { LucideProps } from "@/lib/icons";
import type React from "react";
import { useTheme } from "@/lib/theme/ThemeContext";

type NavIcon = React.ComponentType<LucideProps>;

const NAV_ITEMS: { href: string; label: string; icon: NavIcon }[] = [
  { href: "/",           label: "Operaciones", icon: MapIcon },
  { href: "/missions",   label: "Misiones",    icon: MissionIcon },
  { href: "/fleet",      label: "Flota",       icon: DroneIcon },
  { href: "/compliance", label: "Compliance",  icon: ComplianceIcon },
  { href: "/analytics",  label: "Analytics",   icon: AnalyticsIcon },
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
  const { theme, toggle: toggleTheme } = useTheme();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div
      className="flex h-full flex-col"
      style={{ background: "var(--sky-surface)", borderRight: "1px solid var(--sky-border)" }}
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div
        className="flex h-16 items-center gap-3 px-4"
        style={{ borderBottom: "1px solid var(--sky-border)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-skypro360.png" alt="Skypro360" className="h-9 w-auto" />
        <div className="flex flex-col leading-tight">
          <span
            className="text-sm font-semibold tracking-wide"
            style={{ color: "var(--sky-text)", fontFamily: "var(--font-barlow-condensed), sans-serif", fontSize: "15px", letterSpacing: "0.06em" }}
          >
            OPS<span style={{ color: "#0C9FD8" }}>MANAGER</span>
          </span>
          <span
            className="text-[9px] font-medium uppercase tracking-widest"
            style={{ color: "var(--sky-muted)" }}
          >
            Skypro360
          </span>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all"
              style={{
                background:  active ? "rgba(12,159,216,0.1)"  : "transparent",
                color:       active ? "#0C9FD8"               : "var(--sky-muted)",
                borderLeft:  active ? "2px solid #0C9FD8"     : "2px solid transparent",
                paddingLeft: "10px",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "var(--sky-text)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(12,159,216,0.06)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "var(--sky-muted)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              <Icon
                className="h-4 w-4 flex-shrink-0"
                style={{ color: active ? "#0C9FD8" : "var(--sky-muted)" }}
              />
              <span style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 500 }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── System status indicator ──────────────────────────────────────── */}
      <div className="px-4 py-3" style={{ borderTop: "1px solid var(--sky-border)" }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ background: "rgba(0,217,126,0.06)", border: "1px solid rgba(0,217,126,0.15)" }}>
          <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: "#00D97E", boxShadow: "0 0 6px #00D97E" }} />
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#00D97E" }}>
            Sistema operativo
          </span>
        </div>
      </div>

      {/* ── User + logout ─────────────────────────────────────────────────── */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid var(--sky-border)" }}>
        <div className="flex items-center gap-3">
          {/* Avatar placeholder */}
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: "rgba(12,159,216,0.15)", color: "#0C9FD8", border: "1px solid rgba(12,159,216,0.3)" }}
          >
            {(userName ?? "?")[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold" style={{ color: "var(--sky-text)" }}>{userName}</p>
            <p className="truncate text-[10px]" style={{ color: "var(--sky-muted)" }}>{userEmail}</p>
          </div>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            className="flex-shrink-0 rounded-md p-1.5 transition-colors"
            style={{ color: "var(--sky-muted)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#0C9FD8")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--sky-muted)")}
          >
            {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Cerrar sesion"
            className="flex-shrink-0 rounded-md p-1.5 transition-colors"
            style={{ color: "var(--sky-muted)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#F04E1C")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--sky-muted)")}
          >
            <LogOutIcon className="h-4 w-4" />
          </button>
        </div>
        {userRole && (
          <div className="mt-2 px-3">
            <span
              className="text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-sm"
              style={{ background: "rgba(12,159,216,0.1)", color: "var(--sky-muted)", border: "1px solid rgba(12,159,216,0.15)" }}
            >
              {userRole}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-md p-2 shadow-md lg:hidden"
        style={{ background: "var(--sky-surface)", border: "1px solid var(--sky-border)" }}
        aria-label="Abrir menu"
      >
        <MenuIcon className="h-5 w-5" style={{ color: "var(--sky-text)" }} />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-shrink-0 lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(8,13,20,0.8)" }}
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-60 shadow-2xl" style={{ height: "100%" }}>
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1"
              style={{ color: "#6BA3C0" }}
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
