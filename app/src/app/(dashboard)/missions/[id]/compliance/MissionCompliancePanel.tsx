"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  Mission,
  Drone,
  Pilot,
  FormPlanning,
  FormPreflight,
  FormPostflight,
  FormIncident,
} from "@/lib/db/schema";
import MissionStatusBadge from "@/modules/missions/components/MissionStatusBadge";
import PlanningForm from "@/modules/compliance/components/PlanningForm";
import PreFlightForm from "@/modules/compliance/components/PreFlightForm";
import PostFlightForm from "@/modules/compliance/components/PostFlightForm";
import IncidentForm from "@/modules/compliance/components/IncidentForm";
import StateTransitionBar from "./StateTransitionBar";

type User = { id: string; name: string; email: string };

export default function MissionCompliancePanel({
  mission,
  drones,
  pilots,
  users,
  planning,
  preflights,
  postflights,
  incidents,
}: {
  mission: Mission;
  drones: Drone[];
  pilots: Pilot[];
  users: User[];
  planning: FormPlanning | null;
  preflights: FormPreflight[];
  postflights: FormPostflight[];
  incidents: FormIncident[];
}) {
  const [showForm, setShowForm] = useState<
    "planning" | "preflight" | "postflight" | "incident" | null
  >(null);

  const drone = drones.find((d) => d.id === mission.droneId);
  const pilot = pilots.find((p) => p.id === mission.pilotId);
  const pilotUser = users.find((u) => u.id === pilot?.userId);

  const completionItems = [
    { label: "Planificacion (A.4)", done: !!planning },
    { label: "Pre-vuelo (A.5/A.6)", done: preflights.length > 0 },
    { label: "Post-vuelo (A.7/A.8)", done: postflights.length > 0 },
  ];
  const completionPct = Math.round(
    (completionItems.filter((i) => i.done).length / completionItems.length) * 100,
  );

  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto max-w-4xl px-6 py-6">
      {/* Back button */}
      <Link
        href="/missions"
        className="mb-4 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
        style={{
          background: "var(--sky-surface-2)",
          border: "1px solid var(--sky-border)",
          color: "var(--sky-muted)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = "#0C9FD8";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(12,159,216,0.4)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = "var(--sky-muted)";
          (e.currentTarget as HTMLElement).style.borderColor = "var(--sky-border)";
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Volver a misiones
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="text-sm font-mono" style={{ color: "var(--sky-muted)" }}>{mission.code}</span>
          <h1 className="mt-1 text-xl font-semibold" style={{ color: "var(--sky-text)" }}>{mission.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <MissionStatusBadge status={mission.status} />
          <Link
            href={`/missions/${mission.id}/compliance/pdf`}
            className="rounded-md px-3 py-2 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: "#0C9FD8", color: "#fff" }}
          >
            Generar PDF
          </Link>
        </div>
      </div>

      {/* State transition bar — siguiente paso en contexto */}
      <StateTransitionBar
        mission={mission}
        hasPlanning={!!planning}
        preflightCount={preflights.length}
        postflightCount={postflights.length}
        incidentCount={incidents.length}
      />

      {/* Mission info + completion */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-gray-400">Piloto</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {pilotUser?.name ?? "Sin asignar"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-gray-400">Drone</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {drone?.model ?? "Sin asignar"}
          </p>
          {drone && (
            <p className="text-xs text-gray-400">{drone.serialNumber}</p>
          )}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-gray-400">Compliance</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900">{completionPct}%</span>
          </div>
          <div className="mt-2 space-y-1">
            {completionItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs">
                <span className={item.done ? "text-emerald-500" : "text-gray-300"}>
                  {item.done ? "\u2713" : "\u25CB"}
                </span>
                <span className={item.done ? "text-gray-700" : "text-gray-400"}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {/* Planning A.4 */}
        <ComplianceSection
          title="Planificacion Operacional (A.4)"
          color="blue"
          hasData={!!planning}
          onAdd={() => setShowForm("planning")}
          buttonLabel={planning ? "Editar" : "Completar"}
        >
          {planning && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <Field label="Nivel riesgo" value={planning.riskLevel} />
              <Field label="Tipo operacion" value={planning.operationType} />
              <Field label="Altitud max" value={planning.maxAltitude} />
              <Field label="RP aprobado" value={planning.rpApproved ? "Si" : "No"} />
              <Field label="Prevision meteo" value={planning.weatherForecast} span2 />
              {planning.signatureData && (
                <div className="col-span-1">
                  <p className="text-xs" style={{ color: "var(--sky-muted)" }}>Firma planificador</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={planning.signatureData} alt="Firma planificador" className="mt-1 h-12 rounded p-1" style={{ border: "1px solid var(--sky-border)", background: "var(--sky-surface-2)" }} />
                </div>
              )}
              {planning.rpSignature && (
                <div className="col-span-1">
                  <p className="text-xs" style={{ color: "var(--sky-muted)" }}>Firma RP (Responsable Operaciones)</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={planning.rpSignature} alt="Firma RP" className="mt-1 h-12 rounded p-1" style={{ border: "1px solid var(--sky-border)", background: "var(--sky-surface-2)" }} />
                </div>
              )}
              {planning.rpApproved && !planning.rpSignature && (
                <div className="col-span-1">
                  <p className="text-xs" style={{ color: "var(--sky-muted)" }}>Firma RP</p>
                  <div
                    className="mt-1 h-12 rounded flex items-center justify-center text-[10px]"
                    style={{
                      border: "1px dashed var(--sky-border-2)",
                      background: "rgba(245,197,24,0.06)",
                      color: "var(--sky-accent-yellow)",
                    }}
                  >
                    Pendiente de firma del RP
                  </div>
                </div>
              )}
            </div>
          )}
        </ComplianceSection>

        {/* Preflight A.5/A.6 */}
        <ComplianceSection
          title="Pre-Vuelo (A.5/A.6)"
          color="emerald"
          hasData={preflights.length > 0}
          onAdd={() => setShowForm("preflight")}
          buttonLabel="Nuevo checklist"
        >
          {preflights.map((pf, i) => (
            <div key={pf.id} className="mb-3 rounded-md border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">Checklist #{i + 1}</span>
                <span className="text-gray-400">
                  {new Date(pf.createdAt).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <Field label="Espacio aereo" value={pf.airspaceStatus} />
                <Field label="UAS" value={pf.uasId} />
              </div>
              {pf.signatureData && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={pf.signatureData} alt="Firma" className="mt-2 h-10 rounded border border-gray-200 bg-white p-1" />
              )}
            </div>
          ))}
        </ComplianceSection>

        {/* Postflight A.7/A.8 */}
        <ComplianceSection
          title="Post-Vuelo (A.7/A.8)"
          color="amber"
          hasData={postflights.length > 0}
          onAdd={() => setShowForm("postflight")}
          buttonLabel="Nuevo checklist"
        >
          {postflights.map((pf, i) => (
            <div key={pf.id} className="mb-3 rounded-md border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">Checklist #{i + 1}</span>
                <span className="text-gray-400">
                  {new Date(pf.createdAt).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <Field label="Bateria" value={pf.batteryRemaining} />
                <Field label="UAS" value={pf.uasId} />
              </div>
              {pf.signatureData && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={pf.signatureData} alt="Firma" className="mt-2 h-10 rounded border border-gray-200 bg-white p-1" />
              )}
            </div>
          ))}
        </ComplianceSection>

        {/* Incidents */}
        <ComplianceSection
          title="Incidentes (Anexo I)"
          color="red"
          hasData={incidents.length > 0}
          onAdd={() => setShowForm("incident")}
          buttonLabel="Reportar incidente"
        >
          {incidents.map((inc) => {
            const isNoIncident = inc.incidentType === "none";
            const styles = isNoIncident
              ? {
                  border: "1px solid rgba(0,135,74,0.3)",
                  background: "rgba(0,135,74,0.06)",
                  titleColor: "var(--sky-accent-green)",
                }
              : {
                  border: "1px solid rgba(229,62,62,0.3)",
                  background: "rgba(229,62,62,0.06)",
                  titleColor: "var(--sky-accent-red)",
                };
            return (
              <div key={inc.id} className="mb-3 rounded-md p-3" style={{ border: styles.border, background: styles.background }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold capitalize" style={{ color: styles.titleColor }}>
                    {isNoIncident ? "✓ Sin incidentes (declaracion formal)" : inc.incidentType.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs" style={{ color: "var(--sky-muted)" }}>
                    {new Date(inc.createdAt).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm" style={{ color: "var(--sky-text)" }}>{inc.description}</p>
                {inc.aesaNotified && (
                  <span
                    className="mt-2 inline-block rounded px-2 py-0.5 text-xs font-medium"
                    style={{ background: "rgba(229,62,62,0.15)", color: "var(--sky-accent-red)", border: "1px solid rgba(229,62,62,0.4)" }}
                  >
                    AESA notificada
                  </span>
                )}
                {inc.signatureData && (
                  <div className="mt-2">
                    <p className="text-[10px]" style={{ color: "var(--sky-muted)" }}>Firma del informante</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={inc.signatureData} alt="Firma" className="mt-1 h-10 rounded p-1" style={{ border: "1px solid var(--sky-border)", background: "var(--sky-surface-2)" }} />
                  </div>
                )}
              </div>
            );
          })}
        </ComplianceSection>
      </div>

      {/* Modals */}
      {showForm === "planning" && (
        <PlanningForm
          mission={mission}
          existing={planning}
          onClose={() => setShowForm(null)}
        />
      )}
      {showForm === "preflight" && (
        <PreFlightForm
          mission={mission}
          drones={drones}
          onClose={() => setShowForm(null)}
        />
      )}
      {showForm === "postflight" && (
        <PostFlightForm
          mission={mission}
          drones={drones}
          onClose={() => setShowForm(null)}
        />
      )}
      {showForm === "incident" && (
        <IncidentForm
          mission={mission}
          onClose={() => setShowForm(null)}
        />
      )}
    </div>
    </div>
  );
}

function ComplianceSection({
  title,
  color,
  hasData,
  onAdd,
  buttonLabel,
  children,
}: {
  title: string;
  color: string;
  hasData: boolean;
  onAdd: () => void;
  buttonLabel: string;
  children: React.ReactNode;
}) {
  const colorMap: Record<string, { border: string; bg: string; text: string; btn: string }> = {
    blue: { border: "border-blue-200", bg: "bg-blue-50", text: "text-blue-700", btn: "bg-blue-600 hover:bg-blue-700" },
    emerald: { border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700", btn: "bg-emerald-600 hover:bg-emerald-700" },
    amber: { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700", btn: "bg-amber-600 hover:bg-amber-700" },
    red: { border: "border-red-200", bg: "bg-red-50", text: "text-red-700", btn: "bg-red-600 hover:bg-red-700" },
  };
  const c = colorMap[color] ?? colorMap.blue;

  return (
    <div className={`rounded-lg border ${c.border} bg-white`}>
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2 w-2 rounded-full ${hasData ? "bg-emerald-400" : "bg-gray-300"}`} />
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <button
          onClick={onAdd}
          className={`rounded-md px-3 py-1.5 text-xs font-medium text-white ${c.btn}`}
        >
          {buttonLabel}
        </button>
      </div>
      <div className="p-4">
        {hasData ? (
          children
        ) : (
          <p className="text-center text-sm text-gray-400">Sin datos. Haga clic en &quot;{buttonLabel}&quot; para comenzar.</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, span2 }: { label: string; value: string | null | undefined; span2?: boolean }) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-gray-900">{value || "—"}</p>
    </div>
  );
}
