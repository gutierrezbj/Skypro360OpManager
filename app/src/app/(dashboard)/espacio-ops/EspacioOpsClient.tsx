"use client";

import { useState } from "react";
import type { Mission, Drone, Pilot } from "@/lib/db/schema";
import MissionsMap from "@/modules/missions/components/MissionsMap";
import MissionStatusBadge from "@/modules/missions/components/MissionStatusBadge";
import ExpiryAlerts from "@/modules/compliance/components/ExpiryAlerts";
import WeatherWidget from "@/modules/integrations/components/WeatherWidget";
import { useTelemetry } from "@/modules/telemetry/hooks/useTelemetry";
import { PRIORITY_LABELS, STATUS_HEX } from "@/modules/missions/state-machine";
import { DroneIcon, PilotIcon } from "@/lib/icons";
import Link from "next/link";

type PilotWithUser = Pilot & { userName?: string };

export default function EspacioOpsClient({
  missions,
  pilots,
  drones,
  stats,
}: {
  missions: Mission[];
  pilots: PilotWithUser[];
  drones: Drone[];
  stats: {
    activeMissions: number;
    plannedMissions: number;
    completedMissions: number;
    activeDrones: number;
    totalDrones: number;
    validPilots: number;
    totalPilots: number;
  };
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
    <div className="flex h-full flex-col" style={{ background: "var(--sky-bg)" }}>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 lg:px-6 py-3"
        style={{ background: "var(--sky-surface)", borderBottom: "1px solid var(--sky-border)" }}
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
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
            Espacio <span style={{ color: "var(--sky-accent-blue)" }}>OPS</span>
          </h1>

          <div className="flex flex-wrap gap-2">
            <StatChip label="En vuelo"     value={stats.activeMissions}   color="#00D97E" />
            <StatChip label="Planificadas" value={stats.plannedMissions}  color="#4A8FD4" />
            <StatChip label="Completadas"  value={stats.completedMissions} color="var(--sky-muted)" />
            <div style={{ width: "1px", background: "var(--sky-border)", alignSelf: "stretch" }} className="hidden sm:block" />
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
                <span className="text-xs font-semibold" style={{ color: "var(--sky-accent-green)" }}>
                  {telemetry.size} live
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Map */}
        <div className="flex-1 min-w-0 min-h-0">
          <MissionsMap
            missions={missions}
            drones={drones}
            pilots={pilots}
            onSelectMission={handleSelectMission}
            selectedId={selected?.id ?? null}
            telemetry={telemetry}
          />
        </div>

        {/* Right panel — desktop */}
        <div
          className="hidden lg:flex w-72 flex-shrink-0 flex-col overflow-y-auto p-4 gap-4"
          style={{ background: "var(--sky-surface)", borderLeft: "1px solid var(--sky-border)" }}
        >
          {selected ? (
            <PanelContent
              selected={selected}
              drones={drones}
              pilots={pilots}
              onClose={handleClosePanel}
            />
          ) : (
            <>
              <ExpiryAlerts pilots={pilots} drones={drones} />
              <UngeoreferencedMissions missions={missions} />
              <div
                className="rounded-xl p-3 text-center text-xs"
                style={{ border: "1px dashed var(--sky-border-2)", color: "var(--sky-muted)" }}
              >
                Haz click en una misión del mapa para ver detalles
              </div>
            </>
          )}
        </div>

        {/* Mobile bottom sheet */}
        {selected && panelOpen && (
          <div
            className="lg:hidden fixed inset-x-0 bottom-0 z-30 max-h-[70vh] overflow-y-auto rounded-t-2xl p-4 shadow-2xl"
            style={{ background: "var(--sky-surface)", borderTop: "1px solid var(--sky-border-2)" }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full" style={{ background: "var(--sky-border)" }} />
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

// ── Panel content ─────────────────────────────────────────────────────────────

function PanelContent({
  selected, drones, pilots, onClose,
}: {
  selected: Mission;
  drones: Drone[];
  pilots: PilotWithUser[];
  onClose: () => void;
}) {
  const drone = drones.find((d) => d.id === selected.droneId);
  const pilot = pilots.find((p) => p.id === selected.pilotId);
  const statusColor = STATUS_HEX[selected.status as keyof typeof STATUS_HEX] ?? "#3A5570";

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p
            className="text-[10px] font-medium tracking-widest"
            style={{ color: "var(--sky-accent-blue)", fontFamily: "var(--font-jetbrains), monospace" }}
          >
            {selected.code}
          </p>
          <h3 className="mt-0.5 text-sm font-semibold" style={{ color: "var(--sky-text)" }}>
            {selected.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-md p-1 text-lg leading-none"
          style={{ color: "var(--sky-muted)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--sky-text)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--sky-muted)")}
        >
          &times;
        </button>
      </div>

      <div
        className="h-0.5 rounded-full"
        style={{ background: `linear-gradient(90deg, ${statusColor}, transparent)` }}
      />

      <MissionStatusBadge status={selected.status} />

      {selected.description && (
        <p className="text-xs" style={{ color: "var(--sky-muted)", lineHeight: "1.6" }}>
          {selected.description}
        </p>
      )}

      <div className="space-y-2">
        {drone ? (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5"
            style={{ background: "var(--sky-surface-2)", border: "1px solid var(--sky-border)" }}
          >
            <DroneIcon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--sky-accent-blue)" }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold" style={{ color: "var(--sky-text)" }}>{drone.model}</p>
              <p className="text-[10px]" style={{ color: "var(--sky-muted)", fontFamily: "var(--font-jetbrains), monospace" }}>
                {drone.serialNumber}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg px-3 py-2.5 text-xs"
            style={{ background: "rgba(245,197,24,0.06)", border: "1px solid rgba(245,197,24,0.2)", color: "var(--sky-accent-yellow)" }}>
            Sin drone asignado
          </div>
        )}

        {pilot ? (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5"
            style={{ background: "var(--sky-surface-2)", border: "1px solid var(--sky-border)" }}
          >
            <PilotIcon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--sky-accent-blue)" }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold" style={{ color: "var(--sky-text)" }}>
                {pilot.userName ?? "Piloto"}
              </p>
              <p className="text-[10px]" style={{ color: "var(--sky-muted)" }}>
                {pilot.licenseNumber} · {pilot.certificationStatus}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg px-3 py-2.5 text-xs"
            style={{ background: "rgba(245,197,24,0.06)", border: "1px solid rgba(245,197,24,0.2)", color: "var(--sky-accent-yellow)" }}>
            Sin piloto asignado
          </div>
        )}
      </div>

      <dl className="space-y-2 text-xs" style={{ borderTop: "1px solid var(--sky-border)", paddingTop: "12px" }}>
        <Row label="Prioridad" value={PRIORITY_LABELS[selected.priority] ?? selected.priority} />
        {selected.soraClass   && <Row label="SORA"     value={selected.soraClass} />}
        {selected.maxAltitude && <Row label="Alt. máx" value={`${selected.maxAltitude}m`} />}
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
      </dl>

      {selected.latitude && selected.longitude && (
        <WeatherWidget
          lat={parseFloat(selected.latitude)}
          lng={parseFloat(selected.longitude)}
          date={selected.scheduledStart
            ? new Date(selected.scheduledStart).toISOString().slice(0, 10)
            : undefined}
        />
      )}

      <div className="flex gap-2">
        <Link
          href="/missions"
          className="flex-1 rounded-lg py-2 text-center text-xs font-semibold"
          style={{ background: "rgba(12,159,216,0.08)", border: "1px solid rgba(12,159,216,0.2)", color: "var(--sky-accent-blue)" }}
        >
          Misiones
        </Link>
        <Link
          href={`/missions/${selected.id}/compliance`}
          className="flex-1 rounded-lg py-2 text-center text-xs font-semibold"
          style={{ background: "rgba(240,78,28,0.08)", border: "1px solid rgba(240,78,28,0.2)", color: "var(--sky-accent-orange)" }}
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
      <span className="text-xs font-bold" style={{ color, fontFamily: "var(--font-jetbrains), monospace" }}>
        {value}
      </span>
      <span className="text-[10px]" style={{ color: "var(--sky-muted)" }}>{label}</span>
    </div>
  );
}

function UngeoreferencedMissions({ missions }: { missions: Mission[] }) {
  // Misiones sin coordenadas (no aparecen en el mapa)
  const ungeo = missions.filter(
    (m) => !m.latitude || !m.longitude
  ).filter(
    // No mostrar las terminales — ya completadas/canceladas no necesitan acción
    (m) => !["completed", "aborted", "cancelled"].includes(m.status)
  );

  if (ungeo.length === 0) return null;

  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: "rgba(245,197,24,0.08)",
        border: "1px solid rgba(245,197,24,0.35)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[14px]" style={{ color: "var(--sky-accent-yellow)" }}>⚠</span>
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--sky-accent-yellow)" }}>
          Sin georreferencia ({ungeo.length})
        </p>
      </div>
      <p className="text-[10px] mb-2 leading-relaxed" style={{ color: "var(--sky-muted)" }}>
        Estas misiones no tienen coordenadas, por eso no aparecen en el mapa. Edítalas y añade lat/lng.
      </p>
      <div className="space-y-1.5">
        {ungeo.map((m) => (
          <Link
            key={m.id}
            href={`/missions`}
            className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 transition-colors"
            style={{ background: "var(--sky-surface)", border: "1px solid var(--sky-border)" }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium truncate" style={{ color: "var(--sky-text)" }}>
                {m.name}
              </p>
              <p className="text-[9px]" style={{ color: "var(--sky-muted)", fontFamily: "var(--font-jetbrains), monospace" }}>
                {m.code} · {m.status}
              </p>
            </div>
            <span className="text-[10px] flex-shrink-0" style={{ color: "var(--sky-accent-blue)" }}>
              Editar →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-[10px] uppercase tracking-wider flex-shrink-0" style={{ color: "var(--sky-muted)" }}>
        {label}
      </dt>
      <dd
        className="text-[11px] font-medium text-right"
        style={{ color: "var(--sky-text)", fontFamily: mono ? "var(--font-jetbrains), monospace" : undefined }}
      >
        {value}
      </dd>
    </div>
  );
}
