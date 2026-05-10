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
  const activeMissions = missions.filter((m) => !["draft", "cancelled"].includes(m.status));
  const needsPlanning  = activeMissions.filter((m) => ["planned", "approved"].includes(m.status));
  const needsPreflight = activeMissions.filter((m) => m.status === "preflight");
  const needsPostflight = activeMissions.filter((m) => ["completed", "aborted"].includes(m.status));
  const inFlight       = activeMissions.filter((m) => m.status === "in_flight");

  const pendingDrones      = drones.filter((d) => d.status === "pending_registration");
  const problematicPilots  = pilots.filter((p) => ["expired", "suspended"].includes(p.certificationStatus));

  return (
    <div className="p-6">
      <h1 style={{ color: "var(--sky-text)" }} className="text-lg font-semibold">Compliance AESA</h1>
      <p style={{ color: "var(--sky-muted)" }} className="mt-1 text-sm">
        Documentacion AESA, SORA, EAROs y certificaciones.
      </p>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Planificacion pendiente" value={needsPlanning.length}  accent="#4A8FD4" />
        <StatCard label="Pre-vuelo pendiente"      value={needsPreflight.length} accent="#F5C518" />
        <StatCard label="En vuelo"                 value={inFlight.length}       accent="#00D97E" />
        <StatCard label="Post-vuelo pendiente"     value={needsPostflight.length} accent="#0C9FD8" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left: alerts */}
        <div className="lg:col-span-1 space-y-4">
          <ExpiryAlerts pilots={pilots} drones={drones} />

          {pendingDrones.length > 0 && (
            <div
              style={{ background: "rgba(245,197,24,0.06)", border: "1px solid rgba(245,197,24,0.25)" }}
              className="rounded-lg p-4"
            >
              <h3 style={{ color: "#F5C518" }} className="text-sm font-semibold">
                Registro pendiente ({pendingDrones.length})
              </h3>
              <ul className="mt-2 space-y-1">
                {pendingDrones.map((d) => (
                  <li key={d.id} style={{ color: "var(--sky-text)" }} className="text-xs">
                    {d.model} — {d.serialNumber}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {problematicPilots.length > 0 && (
            <div
              style={{ background: "rgba(229,62,62,0.06)", border: "1px solid rgba(229,62,62,0.25)" }}
              className="rounded-lg p-4"
            >
              <h3 style={{ color: "#FC8181" }} className="text-sm font-semibold">
                Pilotos sin certificacion valida ({problematicPilots.length})
              </h3>
              <ul className="mt-2 space-y-1">
                {problematicPilots.map((p) => (
                  <li key={p.id} style={{ color: "var(--sky-text)" }} className="text-xs">
                    {p.userName ?? p.licenseNumber} — {p.certificationStatus}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pilots.length > 0 && drones.length > 0 && pendingDrones.length === 0 && problematicPilots.length === 0 && (
            <div
              style={{ background: "rgba(0,217,126,0.06)", border: "1px solid rgba(0,217,126,0.25)" }}
              className="rounded-lg p-4"
            >
              <h3 style={{ color: "#00D97E" }} className="text-sm font-semibold">Todo en regla</h3>
              <p style={{ color: "var(--sky-muted)" }} className="mt-1 text-xs">
                Sin alertas de expiracion ni registros pendientes.
              </p>
            </div>
          )}
        </div>

        {/* Right: missions list */}
        <div className="lg:col-span-2">
          <div style={{ background: "var(--sky-surface)", border: "1px solid var(--sky-border)" }} className="rounded-xl overflow-hidden">
            <div style={{ borderBottom: "1px solid var(--sky-border)" }} className="px-4 py-3">
              <h3 style={{ color: "var(--sky-text)" }} className="text-sm font-semibold">
                Misiones con documentacion pendiente
              </h3>
            </div>
            {activeMissions.length === 0 ? (
              <div style={{ color: "var(--sky-muted)" }} className="px-4 py-8 text-center text-sm">
                No hay misiones activas que requieran documentacion.
              </div>
            ) : (
              <div>
                {activeMissions.map((m) => {
                  const pilot = pilots.find((p) => p.id === m.pilotId);
                  const drone = drones.find((d) => d.id === m.droneId);
                  return (
                    <Link
                      key={m.id}
                      href={`/missions/${m.id}/compliance`}
                      style={{ borderBottom: "1px solid var(--sky-border)", display: "flex" }}
                      className="items-center justify-between px-4 py-3 transition-colors hover:bg-[var(--sky-surface-2)]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            style={{ color: "#0C9FD8", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
                            className="text-xs"
                          >
                            {m.code}
                          </span>
                          <MissionStatusBadge status={m.status} />
                        </div>
                        <p style={{ color: "var(--sky-text)" }} className="mt-0.5 text-sm font-medium">{m.name}</p>
                        <div style={{ color: "var(--sky-muted)" }} className="mt-0.5 flex gap-3 text-xs">
                          {pilot && <span>Piloto: {pilot.userName ?? pilot.licenseNumber}</span>}
                          {drone && <span>Drone: {drone.model}</span>}
                          {m.scheduledStart && (
                            <span>
                              {new Date(m.scheduledStart).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
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

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div
      style={{ background: `${accent}0D`, border: `1px solid ${accent}30` }}
      className="rounded-xl p-4"
    >
      <p style={{ color: accent }} className="text-2xl font-bold">{value}</p>
      <p style={{ color: "var(--sky-muted)" }} className="text-xs font-medium mt-0.5">{label}</p>
    </div>
  );
}

function ComplianceStage({ status }: { status: string }) {
  const stages = [
    { key: "planning",   label: "A.4" },
    { key: "preflight",  label: "A.5/6" },
    { key: "postflight", label: "A.7/8" },
  ];

  let activeIdx = 0;
  if (["preflight", "in_flight"].includes(status)) activeIdx = 1;
  if (["completed", "aborted"].includes(status)) activeIdx = 2;

  return (
    <div className="flex items-center gap-1">
      {stages.map((s, i) => (
        <span
          key={s.key}
          style={
            i < activeIdx
              ? { background: "rgba(0,217,126,0.12)", color: "#00D97E", border: "1px solid rgba(0,217,126,0.3)" }
              : i === activeIdx
                ? { background: "rgba(12,159,216,0.12)", color: "#0C9FD8", border: "1px solid rgba(12,159,216,0.3)" }
                : { background: "var(--sky-surface-2)", color: "#3A5570", border: "1px solid var(--sky-border)" }
          }
          className="rounded px-1.5 py-0.5 text-[10px] font-medium"
        >
          {s.label}
        </span>
      ))}
    </div>
  );
}
