"use client";

import { useState } from "react";
import Link from "next/link";
import type { Mission, Drone, Pilot } from "@/lib/db/schema";
import MissionsMap from "@/modules/missions/components/MissionsMap";
import MissionStatusBadge from "@/modules/missions/components/MissionStatusBadge";
import ExpiryAlerts from "@/modules/compliance/components/ExpiryAlerts";
import WeatherWidget from "@/modules/integrations/components/WeatherWidget";
import { useTelemetry } from "@/modules/telemetry/hooks/useTelemetry";
import { PRIORITY_LABELS, STATUS_HEX } from "@/modules/missions/state-machine";
import { DroneIcon, PilotIcon } from "@/lib/icons";

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
  const [selected, setSelected] = useState<Mission | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const telemetry = useTelemetry();

  function handleSelectMission(m: Mission) {
    setSelected(m);
    setPanelOpen(true);
  }

  function handleClosePanel() {
    setSelected(null);
    setPanelOpen(false);
  }

  return (
    <div className="flex h-full flex-col" style={{ background: "#080D14" }}>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 lg:px-6 py-3"
        style={{ background: "#0D1520", borderBottom: "1px solid #162338" }}
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <h1
            className="text-base font-semibold tracking-wide"
            style={{
              color: "#D6E8F5",
              fontFamily: "var(--font-barlow-condensed), sans-serif",
              fontSize: "16px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Mapa de <span style={{ color: "#0C9FD8" }}>Operaciones</span>
          </h1>

          <div className="flex flex-wrap gap-2">
            <StatChip label="En vuelo"     value={stats.activeMissions}   color="#00D97E" />
            <StatChip label="Planificadas" value={stats.plannedMissions}  color="#4A8FD4" />
            <StatChip label="Completadas"  value={stats.completedMissions} color="#4A7FA0" />
            <div style={{ width: "1px", background: "#162338", alignSelf: "stretch" }} className="hidden sm:block" />
            <StatChip label="Drones"  value={`${stats.activeDrones}/${stats.totalDrones}`}  color="#0C9FD8" />
            <StatChip label="Pilotos" value={`${stats.validPilots}/${stats.totalPilots}`}    color="#0C9FD8" />
            {telemetry.size > 0 && (
              <div
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1"
                style={{ background: "rgba(0,217,126,0.08)", border: "1px solid rgba(0,217,126,0.2)" }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "#00D97E", boxShadow: "0 0 6px #00D97E", animation: "sky-pulse 2s infinite" }}
                />
                <span className="text-xs font-semibold" style={{ color: "#00D97E" }}>
                  {telemetry.size} live
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left column: map + fleet strip */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

          {/* Map */}
          <div className="flex-1 min-h-0">
            <MissionsMap
              missions={missions}
              drones={drones}
              pilots={pilots}
              onSelectMission={handleSelectMission}
              selectedId={selected?.id ?? null}
              telemetry={telemetry}
            />
          </div>

          {/* Fleet strip */}
          <div
            className="flex-shrink-0 px-4 py-2.5"
            style={{ background: "#0D1520", borderTop: "1px solid #162338" }}
          >
            <FleetStrip drones={drones} pilots={pilots} />
          </div>
        </div>

        {/* Right panel — desktop */}
        <div
          className="hidden lg:flex w-72 flex-shrink-0 flex-col overflow-y-auto p-4"
          style={{ background: "#0D1520", borderLeft: "1px solid #162338" }}
        >
          {selected ? (
            <PanelContent
              selected={selected}
              drones={drones}
              pilots={pilots}
              onClose={handleClosePanel}
            />
          ) : (
            <ExpiryAlerts pilots={pilots} drones={drones} />
          )}
        </div>

        {/* Mobile bottom sheet */}
        {selected && panelOpen && (
          <div
            className="lg:hidden fixed inset-x-0 bottom-0 z-30 max-h-[70vh] overflow-y-auto rounded-t-2xl p-4 shadow-2xl"
            style={{ background: "#0D1520", borderTop: "1px solid #1E3A5F" }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full" style={{ background: "#162338" }} />
            <PanelContent
              selected={selected}
              drones={drones}
              pilots={pilots}
              onClose={handleClosePanel}
            />
          </div>
        )}
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
        style={{ color: "#243A52" }}
      >
        Flota
      </span>
      <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
        {drones.map((d) => <DroneCard key={d.id} drone={d} />)}
        {pilots.map((p) => <PilotCard key={p.id} pilot={p} />)}
        {drones.length === 0 && pilots.length === 0 && (
          <span className="text-xs py-1" style={{ color: "#243A52" }}>Sin flota registrada</span>
        )}
      </div>
    </div>
  );
}

function DroneCard({ drone }: { drone: Drone }) {
  const dot = DRONE_STATUS_DOT[drone.status] ?? "#3A5570";
  return (
    <Link
      href="/fleet"
      className="flex-shrink-0 flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all"
      style={{ background: "#111D2E", border: "1px solid #162338" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#1E3A5F";
        (e.currentTarget as HTMLElement).style.background = "#162338";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#162338";
        (e.currentTarget as HTMLElement).style.background = "#111D2E";
      }}
    >
      <DroneIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#4A7FA0" }} />
      <div className="min-w-0">
        <p
          className="text-[11px] font-semibold leading-tight truncate max-w-[90px]"
          style={{ color: "#D6E8F5" }}
        >
          {drone.model}
        </p>
        <p
          className="text-[9px] leading-tight"
          style={{ color: "#4A7FA0", fontFamily: "var(--font-jetbrains), monospace" }}
        >
          {drone.serialNumber}
        </p>
      </div>
      <span
        className="flex-shrink-0 h-1.5 w-1.5 rounded-full"
        style={{ background: dot }}
        title={drone.status}
      />
    </Link>
  );
}

function PilotCard({ pilot }: { pilot: PilotWithUser }) {
  const dot = PILOT_STATUS_DOT[pilot.certificationStatus ?? "pending"] ?? "#3A5570";
  return (
    <Link
      href="/fleet"
      className="flex-shrink-0 flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all"
      style={{ background: "#111D2E", border: "1px solid #162338" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#1E3A5F";
        (e.currentTarget as HTMLElement).style.background = "#162338";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#162338";
        (e.currentTarget as HTMLElement).style.background = "#111D2E";
      }}
    >
      <PilotIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#4A7FA0" }} />
      <div className="min-w-0">
        <p
          className="text-[11px] font-semibold leading-tight truncate max-w-[90px]"
          style={{ color: "#D6E8F5" }}
        >
          {pilot.userName ?? "Piloto"}
        </p>
        <p className="text-[9px] leading-tight" style={{ color: "#4A7FA0" }}>
          {pilot.flightHours ?? 0}h vuelo
        </p>
      </div>
      <span
        className="flex-shrink-0 h-1.5 w-1.5 rounded-full"
        style={{ background: dot }}
        title={pilot.certificationStatus ?? "pending"}
      />
    </Link>
  );
}

// ── Panel content ─────────────────────────────────────────────────────────────

function PanelContent({
  selected,
  drones,
  pilots,
  onClose,
}: {
  selected: Mission;
  drones: Drone[];
  pilots: (Pilot & { userName?: string })[];
  onClose: () => void;
}) {
  const drone = drones.find((d) => d.id === selected.droneId);
  const pilot = pilots.find((p) => p.id === selected.pilotId);
  const statusColor = STATUS_HEX[selected.status as keyof typeof STATUS_HEX] ?? "#3A5570";

  return (
    <>
      {/* Mission header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p
            className="text-[10px] font-medium tracking-widest"
            style={{ color: "#4A7FA0", fontFamily: "var(--font-jetbrains), monospace" }}
          >
            {selected.code}
          </p>
          <h3 className="mt-0.5 text-sm font-semibold" style={{ color: "#D6E8F5" }}>
            {selected.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-md p-1 text-lg leading-none transition-colors"
          style={{ color: "#4A7FA0" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#D6E8F5")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#4A7FA0")}
        >
          &times;
        </button>
      </div>

      {/* Status accent bar */}
      <div
        className="mb-3 h-0.5 rounded-full"
        style={{ background: `linear-gradient(90deg, ${statusColor}, transparent)` }}
      />

      <MissionStatusBadge status={selected.status} />

      {selected.description && (
        <p className="mt-3 text-xs" style={{ color: "#4A7FA0", lineHeight: "1.6" }}>
          {selected.description}
        </p>
      )}

      {/* Assigned assets */}
      <div className="mt-4 space-y-2">
        {drone ? (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5"
            style={{ background: "#111D2E", border: "1px solid #162338" }}
          >
            <DroneIcon className="h-4 w-4 flex-shrink-0" style={{ color: "#0C9FD8" }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold" style={{ color: "#D6E8F5" }}>{drone.model}</p>
              <p
                className="text-[10px]"
                style={{ color: "#4A7FA0", fontFamily: "var(--font-jetbrains), monospace" }}
              >
                {drone.serialNumber}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="rounded-lg px-3 py-2.5 text-xs"
            style={{
              background: "rgba(245,197,24,0.06)",
              border: "1px solid rgba(245,197,24,0.2)",
              color: "#F5C518",
            }}
          >
            Sin drone asignado
          </div>
        )}

        {pilot ? (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5"
            style={{ background: "#111D2E", border: "1px solid #162338" }}
          >
            <PilotIcon className="h-4 w-4 flex-shrink-0" style={{ color: "#0C9FD8" }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold" style={{ color: "#D6E8F5" }}>
                {pilot.userName ?? "Piloto"}
              </p>
              <p className="text-[10px]" style={{ color: "#4A7FA0" }}>
                {pilot.licenseNumber} · {pilot.certificationStatus}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="rounded-lg px-3 py-2.5 text-xs"
            style={{
              background: "rgba(245,197,24,0.06)",
              border: "1px solid rgba(245,197,24,0.2)",
              color: "#F5C518",
            }}
          >
            Sin piloto asignado
          </div>
        )}
      </div>

      {/* Data rows */}
      <dl
        className="mt-4 space-y-2 text-xs"
        style={{ borderTop: "1px solid #162338", paddingTop: "12px" }}
      >
        <Row label="Prioridad" value={PRIORITY_LABELS[selected.priority] ?? selected.priority} />
        {selected.soraClass    && <Row label="SORA"       value={selected.soraClass} />}
        {selected.maxAltitude  && <Row label="Alt. máx"   value={`${selected.maxAltitude}m`} />}
        {selected.latitude && selected.longitude && (
          <Row
            label="Coords"
            value={`${parseFloat(selected.latitude).toFixed(4)}, ${parseFloat(selected.longitude).toFixed(4)}`}
            mono
          />
        )}
        {selected.scheduledStart && (
          <Row
            label="Programada"
            value={new Date(selected.scheduledStart).toLocaleString("es-ES", {
              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
            })}
          />
        )}
        {selected.actualStart && (
          <Row
            label="Inicio real"
            value={new Date(selected.actualStart).toLocaleString("es-ES", {
              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
            })}
          />
        )}
      </dl>

      {/* Weather */}
      {selected.latitude && selected.longitude && (
        <div className="mt-4">
          <WeatherWidget
            lat={parseFloat(selected.latitude)}
            lng={parseFloat(selected.longitude)}
            date={selected.scheduledStart
              ? new Date(selected.scheduledStart).toISOString().slice(0, 10)
              : undefined}
          />
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <Link
          href="/missions"
          className="flex-1 rounded-lg py-2 text-center text-xs font-semibold transition-all"
          style={{
            background: "rgba(12,159,216,0.08)",
            border: "1px solid rgba(12,159,216,0.2)",
            color: "#0C9FD8",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(12,159,216,0.15)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(12,159,216,0.08)")}
        >
          Misiones
        </Link>
        <Link
          href={`/missions/${selected.id}/compliance`}
          className="flex-1 rounded-lg py-2 text-center text-xs font-semibold transition-all"
          style={{
            background: "rgba(240,78,28,0.08)",
            border: "1px solid rgba(240,78,28,0.2)",
            color: "#F04E1C",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(240,78,28,0.15)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(240,78,28,0.08)")}
        >
          Compliance
        </Link>
      </div>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatChip({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1"
      style={{ background: `${color}10`, border: `1px solid ${color}22` }}
    >
      <span
        className="text-xs font-bold"
        style={{
          color,
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: "12px",
        }}
      >
        {value}
      </span>
      <span className="text-[10px]" style={{ color: "#4A7FA0" }}>{label}</span>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-[10px] uppercase tracking-wider flex-shrink-0" style={{ color: "#4A7FA0" }}>
        {label}
      </dt>
      <dd
        className="text-[11px] font-medium text-right"
        style={{
          color: "#D6E8F5",
          fontFamily: mono ? "var(--font-jetbrains), monospace" : undefined,
        }}
      >
        {value}
      </dd>
    </div>
  );
}
