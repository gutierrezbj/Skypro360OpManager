"use client";

import { useState } from "react";
import Link from "next/link";
import type { Mission, Drone, Pilot } from "@/lib/db/schema";
import MissionsMap from "@/modules/missions/components/MissionsMap";
import MissionStatusBadge from "@/modules/missions/components/MissionStatusBadge";
import ExpiryAlerts from "@/modules/compliance/components/ExpiryAlerts";
import WeatherWidget from "@/modules/integrations/components/WeatherWidget";
import { useTelemetry } from "@/modules/telemetry/hooks/useTelemetry";
import { PRIORITY_LABELS } from "@/modules/missions/state-machine";

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
    <div className="flex h-full flex-col">
      {/* Stats bar */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 lg:px-6 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Mapa de Operaciones</h1>
          <div className="flex flex-wrap gap-3 text-sm">
            <StatPill label="En vuelo" value={stats.activeMissions} color="emerald" />
            <StatPill label="Planificadas" value={stats.plannedMissions} color="blue" />
            <StatPill label="Completadas" value={stats.completedMissions} color="gray" />
            <span className="hidden sm:block border-l border-gray-200 dark:border-gray-700" />
            <StatPill label="Drones activos" value={`${stats.activeDrones}/${stats.totalDrones}`} color="indigo" />
            <StatPill label="Pilotos cert." value={`${stats.validPilots}/${stats.totalPilots}`} color="indigo" />
            {telemetry.size > 0 && (
              <span className="flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {telemetry.size} live
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Map + side panel */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Map — full width on mobile, flex-1 on desktop */}
        <div className="flex-1">
          <MissionsMap
            missions={missions}
            drones={drones}
            pilots={pilots}
            onSelectMission={handleSelectMission}
            selectedId={selected?.id ?? null}
            telemetry={telemetry}
          />
        </div>

        {/* Side panel — desktop: inline right panel | mobile: bottom overlay */}
        {selected && (
          <>
            {/* Desktop panel */}
            <div className="hidden lg:flex w-80 flex-shrink-0 flex-col overflow-y-auto border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
              <PanelContent
                selected={selected}
                drones={drones}
                pilots={pilots}
                onClose={handleClosePanel}
              />
            </div>

            {/* Mobile bottom sheet */}
            {panelOpen && (
              <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white dark:bg-gray-900 shadow-2xl border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
                <PanelContent
                  selected={selected}
                  drones={drones}
                  pilots={pilots}
                  onClose={handleClosePanel}
                />
              </div>
            )}
          </>
        )}

        {/* Alerts panel when nothing selected */}
        {!selected && (
          <div className="hidden lg:block w-80 flex-shrink-0 overflow-y-auto border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
            <ExpiryAlerts pilots={pilots} drones={drones} />
          </div>
        )}
      </div>
    </div>
  );
}

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

  return (
    <>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-gray-400 dark:text-gray-500">{selected.code}</p>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{selected.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
        >
          &times;
        </button>
      </div>

      <MissionStatusBadge status={selected.status} />

      {selected.description && (
        <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">{selected.description}</p>
      )}

      {/* Assigned drone & pilot */}
      <div className="mt-3 space-y-2">
        {drone ? (
          <div className="flex items-center gap-2 rounded-md bg-gray-50 dark:bg-gray-800 px-3 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/drone.svg" alt="" className="h-5 w-5 flex-shrink-0 dark:invert" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">{drone.model}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">{drone.serialNumber} &middot; {drone.manufacturer}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-md bg-amber-50 dark:bg-amber-900/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            Sin drone asignado
          </div>
        )}
        {pilot ? (
          <div className="flex items-center gap-2 rounded-md bg-gray-50 dark:bg-gray-800 px-3 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/people.svg" alt="" className="h-5 w-5 flex-shrink-0 dark:invert" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">{pilot.userName ?? "Piloto"}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">{pilot.licenseNumber} &middot; {pilot.certificationStatus}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-md bg-amber-50 dark:bg-amber-900/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            Sin piloto asignado
          </div>
        )}
      </div>

      <dl className="mt-3 space-y-2 text-xs">
        <Row label="Prioridad" value={PRIORITY_LABELS[selected.priority] ?? selected.priority} />
        {selected.soraClass && <Row label="SORA" value={selected.soraClass} />}
        {selected.maxAltitude && <Row label="Alt. max" value={`${selected.maxAltitude}m`} />}
        {selected.latitude && selected.longitude && (
          <Row label="Coordenadas" value={`${parseFloat(selected.latitude).toFixed(4)}, ${parseFloat(selected.longitude).toFixed(4)}`} />
        )}
        {selected.scheduledStart && (
          <Row
            label="Programada"
            value={new Date(selected.scheduledStart).toLocaleString("es-ES", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
        )}
        {selected.actualStart && (
          <Row
            label="Inicio real"
            value={new Date(selected.actualStart).toLocaleString("es-ES", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
        )}
      </dl>

      {/* Weather */}
      {selected.latitude && selected.longitude && (
        <div className="mt-3">
          <WeatherWidget
            lat={parseFloat(selected.latitude)}
            lng={parseFloat(selected.longitude)}
            date={selected.scheduledStart ? new Date(selected.scheduledStart).toISOString().slice(0, 10) : undefined}
          />
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Link
          href="/missions"
          className="flex-1 rounded-md bg-blue-50 dark:bg-blue-900/30 px-3 py-2 text-center text-xs font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
        >
          Ver en Misiones
        </Link>
        <Link
          href={`/missions/${selected.id}/compliance`}
          className="flex-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 text-center text-xs font-medium text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
        >
          Compliance
        </Link>
      </div>
    </>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30",
    blue: "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30",
    gray: "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700",
    indigo: "text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30",
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${colorMap[color] ?? ""}`}>
        {value}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="font-medium text-gray-900 dark:text-white">{value}</dd>
    </div>
  );
}
