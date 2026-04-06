"use client";

import type { Pilot, Drone } from "@/lib/db/schema";

type PilotWithUser = Pilot & { userName?: string };

type Alert = {
  type: "pilot_cert" | "pilot_medical" | "drone_insurance";
  label: string;
  entity: string;
  expiryDate: Date;
  daysLeft: number;
  severity: "critical" | "warning" | "info";
};

function computeAlerts(pilots: PilotWithUser[], drones: Drone[]): Alert[] {
  const now = new Date();
  const alerts: Alert[] = [];

  for (const p of pilots) {
    if (p.certificationExpiry) {
      const days = Math.ceil((new Date(p.certificationExpiry).getTime() - now.getTime()) / 86400000);
      if (days <= 90) {
        alerts.push({
          type: "pilot_cert",
          label: "Certificacion piloto",
          entity: p.userName ?? p.licenseNumber ?? p.id,
          expiryDate: new Date(p.certificationExpiry),
          daysLeft: days,
          severity: days <= 0 ? "critical" : days <= 30 ? "warning" : "info",
        });
      }
    }
    if (p.medicalExpiry) {
      const days = Math.ceil((new Date(p.medicalExpiry).getTime() - now.getTime()) / 86400000);
      if (days <= 90) {
        alerts.push({
          type: "pilot_medical",
          label: "Certificado medico",
          entity: p.userName ?? p.licenseNumber ?? p.id,
          expiryDate: new Date(p.medicalExpiry),
          daysLeft: days,
          severity: days <= 0 ? "critical" : days <= 30 ? "warning" : "info",
        });
      }
    }
  }

  for (const d of drones) {
    if (d.insuranceExpiry) {
      const days = Math.ceil((new Date(d.insuranceExpiry).getTime() - now.getTime()) / 86400000);
      if (days <= 90) {
        alerts.push({
          type: "drone_insurance",
          label: "Seguro drone",
          entity: `${d.model} (${d.serialNumber})`,
          expiryDate: new Date(d.insuranceExpiry),
          daysLeft: days,
          severity: days <= 0 ? "critical" : days <= 30 ? "warning" : "info",
        });
      }
    }
  }

  return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
}

const SEVERITY_META = {
  critical: {
    bg:     "rgba(229,62,62,0.08)",
    border: "rgba(229,62,62,0.25)",
    color:  "#FC8181",
    badge:  { bg: "rgba(229,62,62,0.15)", color: "#FC8181" },
    dot:    "#E53E3E",
  },
  warning: {
    bg:     "rgba(245,197,24,0.08)",
    border: "rgba(245,197,24,0.25)",
    color:  "#F5C518",
    badge:  { bg: "rgba(245,197,24,0.15)", color: "#F5C518" },
    dot:    "#F5C518",
  },
  info: {
    bg:     "rgba(12,159,216,0.06)",
    border: "rgba(12,159,216,0.2)",
    color:  "#4A7FA0",
    badge:  { bg: "rgba(12,159,216,0.12)", color: "#0C9FD8" },
    dot:    "#0C9FD8",
  },
};

export default function ExpiryAlerts({
  pilots,
  drones,
}: {
  pilots: PilotWithUser[];
  drones: Drone[];
}) {
  const alerts = computeAlerts(pilots, drones);

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "#4A7FA0" }}
        >
          Alertas AESA
        </span>
        {alerts.length > 0 && (
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold"
            style={{
              background: "rgba(229,62,62,0.15)",
              color: "#FC8181",
              border: "1px solid rgba(229,62,62,0.3)",
            }}
          >
            {alerts.length}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div
          className="rounded-lg px-4 py-5 text-center"
          style={{
            background: "rgba(0,217,126,0.05)",
            border: "1px solid rgba(0,217,126,0.15)",
          }}
        >
          <div
            className="mb-1 text-xl"
            style={{ color: "#00D97E" }}
          >
            ✓
          </div>
          <p className="text-xs font-semibold" style={{ color: "#00D97E" }}>
            Todo en regla
          </p>
          <p className="mt-0.5 text-[10px]" style={{ color: "#4A7FA0" }}>
            Sin certificaciones próximas a vencer
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert, i) => {
            const meta = SEVERITY_META[alert.severity];
            return (
              <div
                key={`${alert.type}-${alert.entity}-${i}`}
                className="rounded-lg px-3 py-3"
                style={{
                  background: meta.bg,
                  border: `1px solid ${meta.border}`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span
                      className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ background: meta.dot, marginTop: "5px" }}
                    />
                    <div className="min-w-0">
                      <p
                        className="text-[10px] font-medium uppercase tracking-wider"
                        style={{ color: meta.color, opacity: 0.75 }}
                      >
                        {alert.label}
                      </p>
                      <p
                        className="text-xs font-semibold truncate"
                        style={{ color: "#D6E8F5" }}
                      >
                        {alert.entity}
                      </p>
                    </div>
                  </div>
                  <span
                    className="flex-shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold whitespace-nowrap"
                    style={{ background: meta.badge.bg, color: meta.badge.color }}
                  >
                    {alert.daysLeft <= 0 ? "EXPIRADO" : `${alert.daysLeft}d`}
                  </span>
                </div>
                <p
                  className="mt-1.5 text-[10px]"
                  style={{ color: "#4A7FA0", paddingLeft: "18px" }}
                >
                  Expira:{" "}
                  {alert.expiryDate.toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
