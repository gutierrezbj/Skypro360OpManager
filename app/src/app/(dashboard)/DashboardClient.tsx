"use client";

import { useState } from "react";
import Link from "next/link";
import type { Mission, Drone, Pilot } from "@/lib/db/schema";
import MissionsMap from "@/modules/missions/components/MissionsMap";
import MissionStatusBadge from "@/modules/missions/components/MissionStatusBadge";
import ExpiryAlerts from "@/modules/compliance/components/ExpiryAlerts";
import WeatherWidget from "@/modules/integrations/components/WeatherWidget";
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

  return (
    <div className="flex h-full flex-col">
      {/* Stats bar */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold text-gray-900">Mapa de Operaciones</h1>
          <div className="flex gap-4 text-sm">
            <StatPill label="En vuelo" value={stats.activeMissions} color="emerald" />
            <StatPill label="Planificadas" value={stats.plannedMissions} color="blue" />
            <StatPill label="Completadas" value={stats.completedMissions} color="gray" />
            <span className="border-l border-gray-200" />
            <StatPill label="Drones activos" value={`${stats.activeDrones}/${stats.totalDrones}`} color="indigo" />
            <StatPill label="Pilotos cert." value={`${stats.validPilots}/${stats.totalPilots}`} color="indigo" />
          </div>
        </div>
      </div>

      {/* Map + side panel */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <MissionsMap
            missions={missions}
            onSelectMission={(m) => setSelected(m)}
            selectedId={selected?.id ?? null}
          />
        </div>

        {/* Side panel */}
        {selected && (
          <div className="w-80 flex-shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-gray-400">{selected.code}</p>
                <h3 className="text-sm font-semibold text-gray-900">{selected.name}</h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>

            <MissionStatusBadge status={selected.status} />

            {selected.description && (
              <p className="mt-3 text-xs text-gray-600">{selected.description}</p>
            )}

            {/* Assigned drone & pilot */}
            <div className="mt-3 space-y-2">
              {(() => {
                const drone = drones.find((d) => d.id === selected.droneId);
                return drone ? (
                  <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2">
                    <span className="text-base">&#9992;</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-gray-900">{drone.model}</p>
                      <p className="text-[10px] text-gray-500">{drone.serialNumber} &middot; {drone.manufacturer}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    Sin drone asignado
                  </div>
                );
              })()}
              {(() => {
                const pilot = pilots.find((p) => p.id === selected.pilotId);
                return pilot ? (
                  <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2">
                    <span className="text-base">&#128100;</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-gray-900">{pilot.userName ?? "Piloto"}</p>
                      <p className="text-[10px] text-gray-500">{pilot.licenseNumber} &middot; {pilot.certificationStatus}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    Sin piloto asignado
                  </div>
                );
              })()}
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
                className="flex-1 rounded-md bg-blue-50 px-3 py-2 text-center text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                Ver en Misiones
              </Link>
              <Link
                href={`/missions/${selected.id}/compliance`}
                className="flex-1 rounded-md bg-indigo-50 px-3 py-2 text-center text-xs font-medium text-indigo-700 hover:bg-indigo-100"
              >
                Compliance
              </Link>
            </div>
          </div>
        )}

        {/* Alerts panel (right side when no mission selected) */}
        {!selected && (
          <div className="w-80 flex-shrink-0 overflow-y-auto border-l border-gray-200 bg-gray-50 p-4">
            <ExpiryAlerts pilots={pilots} drones={drones} />
          </div>
        )}
      </div>
    </div>
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
    emerald: "text-emerald-700 bg-emerald-50",
    blue: "text-blue-700 bg-blue-50",
    gray: "text-gray-600 bg-gray-100",
    indigo: "text-indigo-700 bg-indigo-50",
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${colorMap[color] ?? ""}`}>
        {value}
      </span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}
