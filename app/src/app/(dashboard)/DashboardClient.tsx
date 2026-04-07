"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Mission, Drone, Pilot } from "@/lib/db/schema";
import MissionStatusBadge from "@/modules/missions/components/MissionStatusBadge";
import ExpiryAlerts from "@/modules/compliance/components/ExpiryAlerts";
import WeatherWidget from "@/modules/integrations/components/WeatherWidget";
import { PRIORITY_LABELS, STATUS_HEX } from "@/modules/missions/state-machine";
import { DroneIcon, PilotIcon, MissionIcon, ClockIcon, MapPinIcon } from "@/lib/icons";

type PilotWithUser = Pilot & { userName?: string };

type Stats = {
  totalMissions: number;
  activeMissions: number;
  plannedMissions: number;
  completedMissions: number;
  totalDrones: number;
  activeDrones: number;
  totalPilots: number;
  validPilots: number;
};

const DRONE_STATUS_DOT: Record<string, string> = {
  active:               "#00D97E",
  maintenance:          "#F5C518",
  retired:              "#3A5570",
  pending_registration: "#0C9FD8",
};

const PILOT_STATUS_DOT: Record<string, string> = {
  valid:     "#00D97E",
  expired:   "#E53E3E",
  suspended: "#F04E1C",
  pending:   "#0C9FD8",
};

// ── Main component ────────────────────────────────────────────────────────────

export default function DashboardClient({
  missions,
  stats,
  pilots,
  drones,
}: {
  missions: Mission[];
  stats: Stats;
  pilots: PilotWithUser[];
  drones: Drone[];
}) {
  const [now, setNow] = useState(() => new Date());
  const [weatherLoc, setWeatherLoc] = useState<{ lat: number; lng: number; label: string } | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const activeMissions = missions.filter((m) =>
    ["in_flight", "preflight"].includes(m.status)
  );
  const recentMissions = [...missions]
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 8);

  // Weather location: default to first active mission or Madrid
  const defaultWeatherLoc = activeMissions.find((m) => m.latitude && m.longitude)
    ? {
        lat: parseFloat(activeMissions.find((m) => m.latitude)!.latitude!),
        lng: parseFloat(activeMissions.find((m) => m.longitude)!.longitude!),
        label: activeMissions.find((m) => m.latitude)!.code,
      }
    : { lat: 40.4168, lng: -3.7038, label: "Madrid" };
  const currentWeatherLoc = weatherLoc ?? defaultWeatherLoc;

  return (
    <div className="flex h-full flex-col overflow-y-auto" style={{ background: "var(--sky-bg)" }}>

      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 lg:px-6 py-3 flex items-center justify-between"
        style={{ background: "var(--sky-surface)", borderBottom: "1px solid var(--sky-border)" }}
      >
        <h1
          className="text-base font-semibold tracking-wide"
          style={{
            color: "var(--sky-text)",
            fontFamily: "var(--font-barlow-condensed), sans-serif",
            fontSize: "16px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Cockpit de <span style={{ color: "#0C9FD8" }}>Operaciones</span>
        </h1>
        <div className="flex items-center gap-4">
          <span
            className="text-xs hidden sm:block"
            style={{ color: "var(--sky-muted)", fontFamily: "var(--font-jetbrains), monospace" }}
          >
            {now.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" })}
            {" · "}
            {now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
          </span>
          {activeMissions.length > 0 && (
            <div
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1"
              style={{ background: "rgba(0,217,126,0.08)", border: "1px solid rgba(0,217,126,0.2)" }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                style={{ background: "#00D97E", boxShadow: "0 0 6px #00D97E", animation: "sky-pulse 2s infinite" }}
              />
              <span className="text-xs font-semibold" style={{ color: "#00D97E" }}>
                {activeMissions.length} en vuelo
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-px"
        style={{ background: "var(--sky-border)", borderBottom: "1px solid var(--sky-border)" }}
      >
        <KpiCard
          label="En vuelo"
          value={stats.activeMissions}
          sub={`de ${stats.totalMissions} misiones`}
          color="#00D97E"
          icon={<MissionIcon className="h-4 w-4" />}
        />
        <KpiCard
          label="Planificadas"
          value={stats.plannedMissions}
          sub="pendientes de inicio"
          color="#4A8FD4"
          icon={<ClockIcon className="h-4 w-4" />}
        />
        <KpiCard
          label="Drones activos"
          value={stats.activeDrones}
          sub={`de ${stats.totalDrones} registrados`}
          color="#0C9FD8"
          icon={<DroneIcon className="h-4 w-4" />}
        />
        <KpiCard
          label="Pilotos validos"
          value={stats.validPilots}
          sub={`de ${stats.totalPilots} registrados`}
          color="#0C9FD8"
          icon={<PilotIcon className="h-4 w-4" />}
        />
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col lg:flex-row gap-0 min-h-0">

        {/* Left column */}
        <div className="flex-1 min-w-0 p-4 lg:p-6 space-y-6 overflow-y-auto">

          {/* Active missions */}
          <section>
            <SectionHeader
              title="Misiones activas"
              count={activeMissions.length}
              href="/missions"
              linkLabel="Ver todas"
            />
            {activeMissions.length === 0 ? (
              <div
                className="rounded-xl py-8 text-center text-sm"
                style={{
                  border: "1px dashed var(--sky-border-2)",
                  color: "var(--sky-muted)",
                }}
              >
                No hay misiones activas ahora mismo
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {activeMissions.map((m) => (
                  <ActiveMissionCard
                    key={m.id}
                    mission={m}
                    drone={drones.find((d) => d.id === m.droneId)}
                    pilot={pilots.find((p) => p.id === m.pilotId)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Recent missions */}
          <section>
            <SectionHeader
              title="Historial reciente"
              count={recentMissions.length}
              href="/missions"
              linkLabel="Ver todas"
            />
            {recentMissions.length === 0 ? (
              <div
                className="rounded-xl py-8 text-center text-sm"
                style={{ border: "1px dashed var(--sky-border-2)", color: "var(--sky-muted)" }}
              >
                No hay misiones registradas
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {recentMissions.map((m) => (
                  <MiniMissionCard key={m.id} mission={m} />
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Right column */}
        <div
          className="w-full lg:w-72 xl:w-80 flex-shrink-0 p-4 space-y-4 overflow-y-auto"
          style={{ borderLeft: "1px solid var(--sky-border)" }}
        >
          <ExpiryAlerts pilots={pilots} drones={drones} />

          <div>
            <SectionHeader title="Meteorologia" />
            <WeatherLocationPicker
              activeMissions={activeMissions}
              selected={currentWeatherLoc}
              onSelect={setWeatherLoc}
            />
            <div className="mt-2">
              <WeatherWidget
                lat={currentWeatherLoc.lat}
                lng={currentWeatherLoc.lng}
              />
            </div>
          </div>

          {/* Stats completados */}
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--sky-surface)", border: "1px solid var(--sky-border)" }}
          >
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--sky-muted)" }}>
              Resumen
            </p>
            <div className="space-y-2">
              <StatRow label="Completadas" value={stats.completedMissions} color="#00D97E" />
              <StatRow label="Total misiones" value={stats.totalMissions} color="#0C9FD8" />
              <StatRow label="Flota total" value={stats.totalDrones + stats.totalPilots} color="#0C9FD8" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Fleet strip ─────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 py-2.5"
        style={{ background: "var(--sky-surface)", borderTop: "1px solid var(--sky-border)" }}
      >
        <FleetStrip drones={drones} pilots={pilots} />
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, color, icon,
}: {
  label: string;
  value: number;
  sub: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="p-4"
      style={{ background: "var(--sky-surface)" }}
    >
      <div className="flex items-start justify-between mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--sky-muted)" }}>
          {label}
        </p>
        <span style={{ color }}>{icon}</span>
      </div>
      <p
        className="text-2xl font-bold"
        style={{ color, fontFamily: "var(--font-jetbrains), monospace" }}
      >
        {value}
      </p>
      <p className="text-[10px] mt-0.5" style={{ color: "var(--sky-dim)" }}>
        {sub}
      </p>
    </div>
  );
}

// ── Active mission card ───────────────────────────────────────────────────────

function ActiveMissionCard({
  mission, drone, pilot,
}: {
  mission: Mission;
  drone?: Drone;
  pilot?: PilotWithUser;
}) {
  const statusColor = STATUS_HEX[mission.status as keyof typeof STATUS_HEX] ?? "#3A5570";
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--sky-surface)", border: "1px solid var(--sky-border)" }}
    >
      <div className="h-1" style={{ background: statusColor }} />
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p
              className="text-[10px] font-medium"
              style={{ color: "#0C9FD8", fontFamily: "var(--font-jetbrains), monospace" }}
            >
              {mission.code}
            </p>
            <p className="text-xs font-semibold mt-0.5 line-clamp-2" style={{ color: "var(--sky-text)" }}>
              {mission.name}
            </p>
          </div>
          <MissionStatusBadge status={mission.status} />
        </div>
        <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--sky-muted)" }}>
          {drone && (
            <span className="flex items-center gap-1">
              <DroneIcon className="h-3 w-3" />
              {drone.model}
            </span>
          )}
          {pilot && (
            <span className="flex items-center gap-1">
              <PilotIcon className="h-3 w-3" />
              {pilot.userName ?? "Piloto"}
            </span>
          )}
        </div>
        <div className="mt-2 pt-2 flex gap-2" style={{ borderTop: "1px solid var(--sky-border)" }}>
          <Link
            href={`/missions`}
            className="flex-1 text-center text-[10px] font-medium rounded py-1 transition-all"
            style={{ background: "rgba(12,159,216,0.08)", color: "#0C9FD8", border: "1px solid rgba(12,159,216,0.2)" }}
          >
            Detalle
          </Link>
          <Link
            href={`/missions/${mission.id}/compliance`}
            className="flex-1 text-center text-[10px] font-medium rounded py-1 transition-all"
            style={{ background: "rgba(240,78,28,0.06)", color: "#F04E1C", border: "1px solid rgba(240,78,28,0.2)" }}
          >
            Compliance
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Mini mission card (historial) ─────────────────────────────────────────────

function MiniMissionCard({ mission }: { mission: Mission }) {
  const statusColor = STATUS_HEX[mission.status as keyof typeof STATUS_HEX] ?? "#3A5570";
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--sky-surface)", border: "1px solid var(--sky-border)" }}
    >
      <div className="h-0.5" style={{ background: statusColor }} />
      <div className="p-3">
        <p
          className="text-[10px] font-medium mb-1"
          style={{ color: "#0C9FD8", fontFamily: "var(--font-jetbrains), monospace" }}
        >
          {mission.code}
        </p>
        <p className="text-xs font-semibold leading-snug mb-2 line-clamp-2" style={{ color: "var(--sky-text)" }}>
          {mission.name}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: "var(--sky-muted)" }}>
            {PRIORITY_LABELS[mission.priority] ?? mission.priority}
          </span>
          <MissionStatusBadge status={mission.status} />
        </div>
      </div>
    </div>
  );
}

// ── Fleet strip ───────────────────────────────────────────────────────────────

function FleetStrip({ drones, pilots }: { drones: Drone[]; pilots: PilotWithUser[] }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex-shrink-0 text-[9px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--sky-dim)" }}
      >
        Flota
      </span>
      <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
        {drones.map((d) => <DroneChip key={d.id} drone={d} />)}
        {pilots.map((p) => <PilotChip key={p.id} pilot={p} />)}
        {drones.length === 0 && pilots.length === 0 && (
          <span className="text-xs py-1" style={{ color: "var(--sky-dim)" }}>Sin flota registrada</span>
        )}
      </div>
    </div>
  );
}

function DroneChip({ drone }: { drone: Drone }) {
  const dot = DRONE_STATUS_DOT[drone.status] ?? "#3A5570";
  return (
    <Link
      href="/fleet"
      className="flex-shrink-0 flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all"
      style={{ background: "var(--sky-surface-2)", border: "1px solid var(--sky-border)" }}
    >
      <DroneIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--sky-muted)" }} />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold leading-tight truncate max-w-[90px]" style={{ color: "var(--sky-text)" }}>
          {drone.model}
        </p>
        <p className="text-[9px] leading-tight" style={{ color: "var(--sky-muted)", fontFamily: "var(--font-jetbrains), monospace" }}>
          {drone.serialNumber}
        </p>
      </div>
      <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full" style={{ background: dot }} title={drone.status} />
    </Link>
  );
}

function PilotChip({ pilot }: { pilot: PilotWithUser }) {
  const dot = PILOT_STATUS_DOT[pilot.certificationStatus ?? "pending"] ?? "#3A5570";
  return (
    <Link
      href="/fleet"
      className="flex-shrink-0 flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all"
      style={{ background: "var(--sky-surface-2)", border: "1px solid var(--sky-border)" }}
    >
      <PilotIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--sky-muted)" }} />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold leading-tight truncate max-w-[90px]" style={{ color: "var(--sky-text)" }}>
          {pilot.userName ?? "Piloto"}
        </p>
        <p className="text-[9px] leading-tight" style={{ color: "var(--sky-muted)" }}>
          {pilot.flightHours ?? 0}h vuelo
        </p>
      </div>
      <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full" style={{ background: dot }} title={pilot.certificationStatus ?? "pending"} />
    </Link>
  );
}

// ── Weather location picker ───────────────────────────────────────────────────

const PRESET_CITIES = [
  { label: "Madrid",    lat: 40.4168, lng: -3.7038 },
  { label: "Sevilla",   lat: 37.3886, lng: -5.9823 },
  { label: "Barcelona", lat: 41.3851, lng:  2.1734 },
  { label: "Valencia",  lat: 39.4699, lng: -0.3763 },
  { label: "Badajoz",   lat: 38.8794, lng: -6.9706 },
  { label: "Bilbao",    lat: 43.2630, lng: -2.9350 },
  { label: "Zaragoza",  lat: 41.6488, lng: -0.8891 },
  { label: "Murcia",    lat: 37.9922, lng: -1.1307 },
];

function WeatherLocationPicker({
  activeMissions,
  selected,
  onSelect,
}: {
  activeMissions: Mission[];
  selected: { lat: number; lng: number; label: string };
  onSelect: (loc: { lat: number; lng: number; label: string }) => void;
}) {
  const missionOptions = activeMissions
    .filter((m) => m.latitude && m.longitude)
    .map((m) => ({ label: m.code, lat: parseFloat(m.latitude!), lng: parseFloat(m.longitude!) }));

  const allOptions = [...missionOptions, ...PRESET_CITIES];

  return (
    <div className="flex flex-wrap gap-1">
      {allOptions.map((opt) => {
        const active = selected.label === opt.label;
        return (
          <button
            key={opt.label}
            onClick={() => onSelect(opt)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-all"
            style={active
              ? { background: "rgba(12,159,216,0.15)", color: "#0C9FD8", border: "1px solid rgba(12,159,216,0.4)" }
              : { background: "var(--sky-surface-2)", color: "var(--sky-muted)", border: "1px solid var(--sky-border)" }
            }
          >
            <MapPinIcon className="h-2.5 w-2.5 flex-shrink-0" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionHeader({
  title, count, href, linkLabel,
}: {
  title: string;
  count?: number;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h2
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--sky-muted)" }}
        >
          {title}
        </h2>
        {count !== undefined && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: "var(--sky-surface-2)", color: "var(--sky-muted)", border: "1px solid var(--sky-border)" }}
          >
            {count}
          </span>
        )}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="text-[11px] font-medium transition-colors"
          style={{ color: "#0C9FD8" }}
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--sky-muted)" }}>{label}</span>
      <span
        className="text-sm font-bold"
        style={{ color, fontFamily: "var(--font-jetbrains), monospace" }}
      >
        {value}
      </span>
    </div>
  );
}
