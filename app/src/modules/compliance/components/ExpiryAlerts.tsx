"use client";

import type { Pilot, Drone } from "@/lib/db/schema";
import { CheckCircleIcon } from "@/lib/icons";

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
    border: "rgba(229,62,62,0.30)",
    color:  "var(--sky-accent-red)",
    badge:  { bg: "rgba(229,62,62,0.18)", color: "var(--sky-accent-red)" },
    dot:    "var(--sky-accent-red)",
  },
  warning: {
    bg:     "rgba(245,197,24,0.08)",
    border: "rgba(245,197,24,0.35)",
    color:  "var(--sky-accent-yellow)",
    badge:  { bg: "rgba(245,197,24,0.20)", color: "var(--sky-accent-yellow)" },
    dot:    "var(--sky-accent-yellow)",
  },
  info: {
    bg:     "rgba(12,159,216,0.06)",
    border: "rgba(12,159,216,0.25)",
    color:  "var(--sky-accent-blue)",
    badge:  { bg: "rgba(12,159,216,0.15)", color: "var(--sky-accent-blue)" },
    dot:    "var(--sky-accent-blue)",
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
          style={{ color: "var(--sky-muted)" }}
        >
          Alertas AESA
        </span>
        {alerts.length > 0 && (
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold"
            style={{
              background: "rgba(229,62,62,0.18)",
              color: "var(--sky-accent-red)",
              border: "1px solid rgba(229,62,62,0.4)",
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
            background: "rgba(0,217,126,0.06)",
            border: "1px solid rgba(0,217,126,0.25)",
          }}
        >
          <div className="mb-1 flex justify-center">
            <CheckCircleIcon className="h-5 w-5" style={{ color: "var(--sky-accent-green)" }} />
          </div>
          <p className="text-xs font-semibold" style={{ color: "var(--sky-accent-green)" }}>
            Todo en regla
          </p>
          <p className="mt-0.5 text-[10px]" style={{ color: "var(--sky-muted)" }}>
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
                        className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: meta.color }}
                      >
                        {alert.label}
                      </p>
                      <p
                        className="text-xs font-semibold truncate"
                        style={{ color: "var(--sky-text)" }}
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
                  style={{ color: "var(--sky-muted)", paddingLeft: "18px" }}
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
