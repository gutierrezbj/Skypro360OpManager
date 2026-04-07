"use client";

import type { AnalyticsData } from "@/lib/db/queries/analytics.queries";
import { MissionIcon, CheckCircleIcon, DroneIcon, TimerIcon, PilotsIcon } from "@/lib/icons";
import type { LucideProps } from "@/lib/icons";
import type React from "react";

const STATUS_COLORS: Record<string, string> = {
  draft:      "#3A5570",
  planned:    "#4A8FD4",
  approved:   "#0C9FD8",
  preflight:  "#F5C518",
  in_flight:  "#00D97E",
  completed:  "#2ECC71",
  aborted:    "#E53E3E",
  cancelled:  "#3A5570",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador", planned: "Planificada", approved: "Aprobada",
  preflight: "Pre-vuelo", in_flight: "En vuelo", completed: "Completada",
  aborted: "Abortada", cancelled: "Cancelada",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#4A8FD4", normal: "var(--sky-text)", high: "#F5C518", urgent: "#F04E1C",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Baja", normal: "Normal", high: "Alta", urgent: "Urgente",
};

const DRONE_STATUS_COLORS: Record<string, string> = {
  active: "#00D97E", maintenance: "#F5C518",
  retired: "#3A5570", pending_registration: "#4A8FD4",
};

const DRONE_STATUS_LABELS: Record<string, string> = {
  active: "Activo", maintenance: "Mantenimiento",
  retired: "Retirado", pending_registration: "Pendiente registro",
};

const CARD_STYLE = {
  background: "var(--sky-surface)",
  border: "1px solid var(--sky-border)",
  borderRadius: "16px",
  padding: "20px",
};

export default function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const flightHoursDisplay = data.totalFlightMinutesFromLogs > 0
    ? (data.totalFlightMinutesFromLogs / 60).toFixed(1)
    : data.totalFlightHoursFromPilots.toFixed(1);

  const maxMonthly = Math.max(...data.monthly.map((m) => m.total), 1);

  const donutData = data.byStatus.filter((s) => s.total > 0);
  const donutTotal = donutData.reduce((s, d) => s + d.total, 0);
  const R = 42;
  const CIRC = 2 * Math.PI * R;
  let donutOffset = 0;
  const donutSegments = donutData.map((d) => {
    const pct = d.total / donutTotal;
    const dash = pct * CIRC;
    const gap = CIRC - dash;
    const rotation = donutOffset;
    donutOffset += pct * 360;
    return { ...d, dash, gap, rotation };
  });

  return (
    <div style={{ background: "var(--sky-bg)" }} className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        <div>
          <h1 style={{ color: "var(--sky-text)" }} className="text-2xl font-bold">Analytics</h1>
          <p style={{ color: "var(--sky-muted)" }} className="mt-1 text-sm">
            Metricas operativas · datos en tiempo real
          </p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard label="Misiones totales" value={data.totalMissions} icon={MissionIcon} />
          <KpiCard
            label="Completadas"
            value={data.completedMissions}
            sub={`${data.completionRate}% tasa exito`}
            accent="#00D97E"
            icon={CheckCircleIcon}
          />
          <KpiCard
            label="En vuelo ahora"
            value={data.inFlightNow}
            accent={data.inFlightNow > 0 ? "#00D97E" : "#3A5570"}
            pulse={data.inFlightNow > 0}
            icon={DroneIcon}
          />
          <KpiCard
            label="Horas de vuelo"
            value={`${flightHoursDisplay}h`}
            accent="#0C9FD8"
            icon={TimerIcon}
          />
          <KpiCard
            label="Flota activa"
            value={`${data.activeDrones}/${data.totalDrones}`}
            sub={`${data.validPilots}/${data.totalPilots} pilotos cert.`}
            accent="#4A8FD4"
            icon={PilotsIcon}
          />
        </div>

        {/* Row 2: Donut + Monthly */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          <div style={CARD_STYLE}>
            <h2 style={{ color: "var(--sky-text)" }} className="mb-4 text-sm font-semibold">
              Misiones por estado
            </h2>
            {donutTotal > 0 ? (
              <div className="flex items-center gap-6">
                <svg viewBox="0 0 100 100" className="h-28 w-28 flex-shrink-0 -rotate-90">
                  {donutSegments.map((seg) => (
                    <circle
                      key={seg.status}
                      cx="50" cy="50" r={R}
                      fill="none"
                      stroke={STATUS_COLORS[seg.status] ?? "#3A5570"}
                      strokeWidth="14"
                      strokeDasharray={`${seg.dash} ${seg.gap}`}
                      strokeDashoffset={0}
                      style={{ transform: `rotate(${seg.rotation}deg)`, transformOrigin: "50% 50%" }}
                    />
                  ))}
                  <circle cx="50" cy="50" r="28" fill="var(--sky-surface)" />
                </svg>
                <div className="flex flex-col gap-1.5 min-w-0">
                  {donutSegments.map((seg) => (
                    <div key={seg.status} className="flex items-center gap-2 text-xs">
                      <span
                        className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ background: STATUS_COLORS[seg.status] ?? "#3A5570" }}
                      />
                      <span style={{ color: "var(--sky-muted)" }} className="truncate">
                        {STATUS_LABELS[seg.status] ?? seg.status}
                      </span>
                      <span style={{ color: "var(--sky-text)" }} className="ml-auto font-semibold pl-2">
                        {seg.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState text="Sin misiones aun" />
            )}
          </div>

          {/* Monthly bars */}
          <div style={{ ...CARD_STYLE, gridColumn: "span 2" }}>
            <h2 style={{ color: "var(--sky-text)" }} className="mb-4 text-sm font-semibold">
              Evolucion mensual (ultimos 6 meses)
            </h2>
            <div className="flex h-36 items-end gap-2">
              {data.monthly.map((m) => {
                const pct = maxMonthly > 0 ? (m.total / maxMonthly) * 100 : 0;
                return (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                    <span style={{ color: "var(--sky-text)" }} className="text-[10px] font-semibold">
                      {m.total > 0 ? m.total : ""}
                    </span>
                    <div
                      className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${Math.max(pct, m.total > 0 ? 4 : 0)}%`,
                        background: "#0C9FD8",
                      }}
                    />
                    <span style={{ color: "var(--sky-muted)" }} className="text-[10px]">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 3: Priority + Drone status */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

          <div style={CARD_STYLE}>
            <h2 style={{ color: "var(--sky-text)" }} className="mb-4 text-sm font-semibold">
              Misiones por prioridad
            </h2>
            {data.byPriority.length > 0 ? (
              <div className="space-y-3">
                {(["urgent", "high", "normal", "low"] as const).map((p) => {
                  const row = data.byPriority.find((r) => r.priority === p);
                  const val = row?.total ?? 0;
                  const pct = data.totalMissions > 0 ? (val / data.totalMissions) * 100 : 0;
                  return (
                    <div key={p} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span style={{ color: "var(--sky-muted)" }}>{PRIORITY_LABELS[p]}</span>
                        <span style={{ color: "var(--sky-text)" }} className="font-semibold">{val}</span>
                      </div>
                      <div style={{ background: "var(--sky-surface-2)" }} className="h-2 w-full overflow-hidden rounded-full">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: PRIORITY_COLORS[p] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState text="Sin datos" />
            )}
          </div>

          <div style={CARD_STYLE}>
            <h2 style={{ color: "var(--sky-text)" }} className="mb-4 text-sm font-semibold">
              Flota por estado
            </h2>
            {data.byDroneStatus.length > 0 ? (
              <div className="space-y-3">
                {data.byDroneStatus
                  .sort((a, b) => b.total - a.total)
                  .map((row) => {
                    const pct = data.totalDrones > 0 ? (row.total / data.totalDrones) * 100 : 0;
                    return (
                      <div key={row.status} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span style={{ color: "var(--sky-muted)" }}>
                            {DRONE_STATUS_LABELS[row.status] ?? row.status}
                          </span>
                          <span style={{ color: "var(--sky-text)" }} className="font-semibold">{row.total}</span>
                        </div>
                        <div style={{ background: "var(--sky-surface-2)" }} className="h-2 w-full overflow-hidden rounded-full">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              background: DRONE_STATUS_COLORS[row.status] ?? "#3A5570",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <EmptyState text="Sin drones" />
            )}
          </div>
        </div>

        {/* Row 4: Compliance health */}
        <div style={CARD_STYLE}>
          <h2 style={{ color: "var(--sky-text)" }} className="mb-4 text-sm font-semibold">
            Estado compliance
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ComplianceStat label="Pilotos certificados" value={data.validPilots}       total={data.totalPilots}   color="#00D97E" />
            <ComplianceStat label="Drones activos"       value={data.activeDrones}      total={data.totalDrones}   color="#0C9FD8" />
            <ComplianceStat label="Misiones completadas" value={data.completedMissions} total={data.totalMissions} color="#2ECC71" />
            <ComplianceStat label="Tasa exito"           value={data.completionRate}    total={100} unit="%" color="#4A8FD4" />
          </div>
        </div>

      </div>
    </div>
  );
}

function KpiCard({
  label, value, sub, accent = "var(--sky-text)", pulse = false, icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  pulse?: boolean;
  icon?: React.ComponentType<LucideProps>;
}) {
  return (
    <div style={{ background: "var(--sky-surface)", border: "1px solid var(--sky-border)", borderRadius: "16px", padding: "20px" }}>
      <div className="flex items-center justify-between">
        <p style={{ color: "var(--sky-muted)" }} className="text-xs">{label}</p>
        {Icon && <Icon style={{ color: accent, opacity: 0.6 }} className="h-4 w-4" />}
      </div>
      <div className="mt-1 flex items-center gap-2">
        {pulse && (
          <span style={{ background: "#00D97E" }} className="h-2 w-2 rounded-full animate-pulse flex-shrink-0" />
        )}
        <p style={{ color: accent }} className="text-2xl font-bold">{value}</p>
      </div>
      {sub && <p style={{ color: "var(--sky-muted)" }} className="mt-0.5 text-[11px]">{sub}</p>}
    </div>
  );
}

function ComplianceStat({
  label, value, total, unit = "", color,
}: {
  label: string;
  value: number;
  total: number;
  unit?: string;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <p style={{ color: "var(--sky-muted)" }} className="text-xs">{label}</p>
      <p style={{ color: "var(--sky-text)" }} className="text-xl font-bold">
        {value}{unit}
        {!unit && <span style={{ color: "var(--sky-muted)" }} className="text-sm font-normal"> / {total}</span>}
      </p>
      <div style={{ background: "var(--sky-surface-2)" }} className="h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <p style={{ color: "var(--sky-muted)" }} className="text-[10px]">{pct}%</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ color: "#3A5570" }} className="flex h-20 items-center justify-center text-sm">
      {text}
    </div>
  );
}
