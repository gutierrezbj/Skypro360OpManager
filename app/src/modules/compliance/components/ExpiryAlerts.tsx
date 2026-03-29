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

const SEVERITY_STYLES = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

const SEVERITY_BADGE = {
  critical: "bg-red-100 text-red-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-blue-100 text-blue-700",
};

export default function ExpiryAlerts({
  pilots,
  drones,
}: {
  pilots: PilotWithUser[];
  drones: Drone[];
}) {
  const alerts = computeAlerts(pilots, drones);

  if (alerts.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">
        Alertas de expiracion ({alerts.length})
      </h3>
      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <div
            key={`${alert.type}-${alert.entity}-${i}`}
            className={`rounded-md border px-3 py-2 ${SEVERITY_STYLES[alert.severity]}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium">{alert.label}</span>
                <p className="text-sm font-semibold">{alert.entity}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_BADGE[alert.severity]}`}>
                {alert.daysLeft <= 0
                  ? "EXPIRADO"
                  : `${alert.daysLeft}d restantes`}
              </span>
            </div>
            <p className="mt-1 text-xs opacity-75">
              Expira: {alert.expiryDate.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
