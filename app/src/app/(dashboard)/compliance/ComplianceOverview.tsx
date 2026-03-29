"use client";

import Link from "next/link";
import type { Mission, Drone, Pilot } from "@/lib/db/schema";
import ExpiryAlerts from "@/modules/compliance/components/ExpiryAlerts";
import MissionStatusBadge from "@/modules/missions/components/MissionStatusBadge";


type PilotWithUser = Pilot & { userName?: string };

export default function ComplianceOverview({
  missions,
  drones,
  pilots,
}: {
  missions: Mission[];
  drones: Drone[];
  pilots: PilotWithUser[];
}) {
  // Missions that need compliance work (not draft, not cancelled)
  const activeMissions = missions.filter(
    (m) => !["draft", "cancelled"].includes(m.status),
  );

  // Group by compliance readiness
  const needsPlanning = activeMissions.filter((m) =>
    ["planned", "approved"].includes(m.status),
  );
  const needsPreflight = activeMissions.filter((m) => m.status === "preflight");
  const needsPostflight = activeMissions.filter((m) =>
    ["completed", "aborted"].includes(m.status),
  );
  const inFlight = activeMissions.filter((m) => m.status === "in_flight");

  // Drones with pending registration
  const pendingDrones = drones.filter((d) => d.status === "pending_registration");
  // Pilots with expired/suspended certs
  const problematicPilots = pilots.filter((p) =>
    ["expired", "suspended"].includes(p.certificationStatus),
  );

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-gray-900">Compliance AESA</h1>
      <p className="mt-1 text-sm text-gray-500">
        Documentacion AESA, SORA, EAROs y certificaciones.
      </p>

      {/* Stats cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Planificacion pendiente" value={needsPlanning.length} color="blue" />
        <StatCard label="Pre-vuelo pendiente" value={needsPreflight.length} color="yellow" />
        <StatCard label="En vuelo" value={inFlight.length} color="emerald" />
        <StatCard label="Post-vuelo pendiente" value={needsPostflight.length} color="indigo" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left: Expiry alerts */}
        <div className="lg:col-span-1">
          <ExpiryAlerts pilots={pilots} drones={drones} />

          {/* Registration alerts */}
          {pendingDrones.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-sm font-semibold text-amber-800">
                Registro pendiente ({pendingDrones.length})
              </h3>
              <ul className="mt-2 space-y-1">
                {pendingDrones.map((d) => (
                  <li key={d.id} className="text-xs text-amber-700">
                    {d.model} — {d.serialNumber}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Problem pilots */}
          {problematicPilots.length > 0 && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="text-sm font-semibold text-red-800">
                Pilotos sin certificacion valida ({problematicPilots.length})
              </h3>
              <ul className="mt-2 space-y-1">
                {problematicPilots.map((p) => (
                  <li key={p.id} className="text-xs text-red-700">
                    {p.userName ?? p.licenseNumber} — {p.certificationStatus}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No alerts fallback */}
          {pilots.length > 0 && drones.length > 0 && pendingDrones.length === 0 && problematicPilots.length === 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="text-sm font-semibold text-green-800">Todo en regla</h3>
              <p className="mt-1 text-xs text-green-700">
                Sin alertas de expiracion ni registros pendientes.
              </p>
            </div>
          )}
        </div>

        {/* Right: Active missions needing compliance */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Misiones con documentacion pendiente
              </h3>
            </div>
            {activeMissions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No hay misiones activas que requieran documentacion.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {activeMissions.map((m) => {
                  const pilot = pilots.find((p) => p.id === m.pilotId);
                  const drone = drones.find((d) => d.id === m.droneId);
                  return (
                    <Link
                      key={m.id}
                      href={`/missions/${m.id}/compliance`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-400">{m.code}</span>
                          <MissionStatusBadge status={m.status} />
                        </div>
                        <p className="mt-0.5 text-sm font-medium text-gray-900">{m.name}</p>
                        <div className="mt-0.5 flex gap-3 text-xs text-gray-500">
                          {pilot && <span>Piloto: {pilot.userName ?? pilot.licenseNumber}</span>}
                          {drone && <span>Drone: {drone.model}</span>}
                          {m.scheduledStart && (
                            <span>
                              {new Date(m.scheduledStart).toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <ComplianceStage status={m.status} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const styles: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
  };
  return (
    <div className={`rounded-lg border p-4 ${styles[color] ?? ""}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}

function ComplianceStage({ status }: { status: string }) {
  const stages = [
    { key: "planning", label: "A.4" },
    { key: "preflight", label: "A.5/6" },
    { key: "postflight", label: "A.7/8" },
  ];

  // Which stage is "current" based on mission status
  let activeIdx = 0;
  if (["preflight", "in_flight"].includes(status)) activeIdx = 1;
  if (["completed", "aborted"].includes(status)) activeIdx = 2;

  return (
    <div className="flex items-center gap-1">
      {stages.map((s, i) => (
        <span
          key={s.key}
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
            i < activeIdx
              ? "bg-green-100 text-green-700"
              : i === activeIdx
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-400"
          }`}
        >
          {s.label}
        </span>
      ))}
    </div>
  );
}
