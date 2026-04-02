"use client";

import type { AnalyticsData } from "@/lib/db/queries/analytics.queries";
import { MissionIcon, CheckCircleIcon, DroneIcon, TimerIcon, PilotsIcon } from "@/lib/icons";
import type { LucideProps } from "@/lib/icons";
import type React from "react";

const STATUS_COLORS: Record<string, string> = {
  draft:      "#9ca3af",
  planned:    "#3b82f6",
  approved:   "#6366f1",
  preflight:  "#eab308",
  in_flight:  "#10b981",
  completed:  "#22c55e",
  aborted:    "#ef4444",
  cancelled:  "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador", planned: "Planificada", approved: "Aprobada",
  preflight: "Pre-vuelo", in_flight: "En vuelo", completed: "Completada",
  aborted: "Abortada", cancelled: "Cancelada",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#22c55e", normal: "#3b82f6", high: "#f59e0b", urgent: "#ef4444",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Baja", normal: "Normal", high: "Alta", urgent: "Urgente",
};

const DRONE_STATUS_COLORS: Record<string, string> = {
  active: "#10b981", maintenance: "#f59e0b",
  retired: "#6b7280", pending_registration: "#3b82f6",
};

const DRONE_STATUS_LABELS: Record<string, string> = {
  active: "Activo", maintenance: "Mantenimiento",
  retired: "Retirado", pending_registration: "Pendiente registro",
};

export default function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const flightHoursDisplay = data.totalFlightMinutesFromLogs > 0
    ? (data.totalFlightMinutesFromLogs / 60).toFixed(1)
    : data.totalFlightHoursFromPilots.toFixed(1);

  const maxMonthly = Math.max(...data.monthly.map((m) => m.total), 1);

  // Donut chart
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
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Métricas operativas · datos en tiempo real
          </p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard label="Misiones totales" value={data.totalMissions} icon={MissionIcon} />
          <KpiCard
            label="Completadas"
            value={data.completedMissions}
            sub={`${data.completionRate}% tasa éxito`}
            color="emerald"
            icon={CheckCircleIcon}
          />
          <KpiCard
            label="En vuelo ahora"
            value={data.inFlightNow}
            color={data.inFlightNow > 0 ? "emerald" : "gray"}
            pulse={data.inFlightNow > 0}
            icon={DroneIcon}
          />
          <KpiCard
            label="Horas de vuelo"
            value={`${flightHoursDisplay}h`}
            color="blue"
            icon={TimerIcon}
          />
          <KpiCard
            label="Flota activa"
            value={`${data.activeDrones}/${data.totalDrones}`}
            sub={`${data.validPilots}/${data.totalPilots} pilotos cert.`}
            color="indigo"
            icon={PilotsIcon}
          />
        </div>

        {/* Row 2: Donut + Monthly bars */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Donut — status breakdown */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
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
                      stroke={STATUS_COLORS[seg.status] ?? "#9ca3af"}
                      strokeWidth="14"
                      strokeDasharray={`${seg.dash} ${seg.gap}`}
                      strokeDashoffset={0}
                      style={{ transform: `rotate(${seg.rotation}deg)`, transformOrigin: "50% 50%" }}
                    />
                  ))}
                  <circle cx="50" cy="50" r="28" fill="white" className="dark:fill-gray-900" />
                </svg>
                <div className="flex flex-col gap-1.5 min-w-0">
                  {donutSegments.map((seg) => (
                    <div key={seg.status} className="flex items-center gap-2 text-xs">
                      <span
                        className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ background: STATUS_COLORS[seg.status] ?? "#9ca3af" }}
                      />
                      <span className="truncate text-gray-600 dark:text-gray-400">
                        {STATUS_LABELS[seg.status] ?? seg.status}
                      </span>
                      <span className="ml-auto font-semibold text-gray-900 dark:text-white pl-2">
                        {seg.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState text="Sin misiones aún" />
            )}
          </div>

          {/* Monthly bar chart */}
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Evolución mensual (últimos 6 meses)
            </h2>
            <div className="flex h-36 items-end gap-2">
              {data.monthly.map((m) => {
                const pct = maxMonthly > 0 ? (m.total / maxMonthly) * 100 : 0;
                return (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">
                      {m.total > 0 ? m.total : ""}
                    </span>
                    <div className="w-full rounded-t-md bg-blue-500 dark:bg-blue-600 transition-all duration-500"
                      style={{ height: `${Math.max(pct, m.total > 0 ? 4 : 0)}%` }}
                    />
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 3: Priority + Drone status */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

          {/* Priority breakdown */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
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
                        <span className="text-gray-600 dark:text-gray-400">{PRIORITY_LABELS[p]}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{val}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: PRIORITY_COLORS[p],
                          }}
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

          {/* Drone status */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
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
                          <span className="text-gray-600 dark:text-gray-400">
                            {DRONE_STATUS_LABELS[row.status] ?? row.status}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">{row.total}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              background: DRONE_STATUS_COLORS[row.status] ?? "#9ca3af",
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
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Estado compliance
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ComplianceStat
              label="Pilotos certificados"
              value={data.validPilots}
              total={data.totalPilots}
              color="#10b981"
            />
            <ComplianceStat
              label="Drones activos"
              value={data.activeDrones}
              total={data.totalDrones}
              color="#3b82f6"
            />
            <ComplianceStat
              label="Misiones completadas"
              value={data.completedMissions}
              total={data.totalMissions}
              color="#22c55e"
            />
            <ComplianceStat
              label="Tasa éxito"
              value={data.completionRate}
              total={100}
              unit="%"
              color="#6366f1"
            />
          </div>
        </div>

      </div>
    </div>
  );
}

function KpiCard({
  label, value, sub, color = "gray", pulse = false, icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  pulse?: boolean;
  icon?: React.ComponentType<LucideProps>;
}) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    blue: "text-blue-600 dark:text-blue-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
    gray: "text-gray-900 dark:text-white",
  };
  const iconColorMap: Record<string, string> = {
    emerald: "text-emerald-400 dark:text-emerald-500",
    blue: "text-blue-400 dark:text-blue-500",
    indigo: "text-indigo-400 dark:text-indigo-500",
    gray: "text-gray-300 dark:text-gray-600",
  };
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        {Icon && <Icon className={`h-4 w-4 ${iconColorMap[color] ?? iconColorMap.gray}`} />}
      </div>
      <div className="mt-1 flex items-center gap-2">
        {pulse && (
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
        )}
        <p className={`text-2xl font-bold ${colorMap[color] ?? colorMap.gray}`}>
          {value}
        </p>
      </div>
      {sub && <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">{sub}</p>}
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
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white">
        {value}{unit}
        {!unit && <span className="text-sm font-normal text-gray-400 dark:text-gray-500"> / {total}</span>}
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <p className="text-[10px] text-gray-400 dark:text-gray-500">{pct}%</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-20 items-center justify-center text-sm text-gray-400 dark:text-gray-600">
      {text}
    </div>
  );
}
