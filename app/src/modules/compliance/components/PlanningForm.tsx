"use client";

import { useActionState, useState } from "react";
import type { FormPlanning, Mission } from "@/lib/db/schema";
import { savePlanningForm, type ComplianceActionResult } from "../actions/compliance.actions";
import SignaturePad from "./SignaturePad";

const inputStyle = {
  background: "var(--sky-bg)",
  border: "1px solid var(--sky-border-2)",
  color: "var(--sky-text)",
  fontFamily: "var(--font-barlow), sans-serif",
} as const;

const labelStyle = {
  color: "var(--sky-muted)",
} as const;

const RISK_LEVELS = [
  { value: "low", label: "Bajo" },
  { value: "medium", label: "Medio" },
  { value: "high", label: "Alto" },
  { value: "critical", label: "Critico" },
];

const OPERATION_TYPES = [
  { value: "VLOS", label: "VLOS" },
  { value: "BVLOS", label: "BVLOS" },
  { value: "EVLOS", label: "EVLOS" },
];

const PLANNING_CHECKLIST = [
  { key: "geo_zones", label: "Zonas geograficas verificadas (0.4)" },
  { key: "airspace_check", label: "Espacio aereo consultado" },
  { key: "notam_check", label: "NOTAMs revisados" },
  { key: "weather_check", label: "Prevision meteorologica consultada" },
  { key: "earo_coordinated", label: "Coordinacion EARO completada (si aplica)" },
  { key: "flight_zone_req", label: "Requisitos zona de vuelo verificados (0.6)" },
  { key: "risk_mitigation", label: "Medidas de mitigacion de riesgos definidas" },
  { key: "emergency_plan", label: "Plan de emergencia revisado" },
];

export default function PlanningForm({
  mission,
  existing,
  onClose,
}: {
  mission: Mission;
  existing: FormPlanning | null;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ComplianceActionResult | null, FormData>(
    savePlanningForm,
    null,
  );

  const [signature, setSignature] = useState(existing?.signatureData ?? "");
  const [rpSignature, setRpSignature] = useState(existing?.rpSignature ?? "");
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    const data = existing?.jsonData as Record<string, boolean> | undefined;
    return data ?? {};
  });

  if (state?.success) {
    onClose();
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg p-6 shadow-xl" style={{ background: "var(--sky-surface)", border: "1px solid var(--sky-border-2)" }}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono" style={labelStyle}>{mission.code}</p>
            <h2 className="text-lg font-semibold" style={{ color: "var(--sky-text)" }}>Planificacion Operacional (A.4)</h2>
          </div>
          <button onClick={onClose} className="hover:opacity-80" style={labelStyle}>&times;</button>
        </div>

        {state?.error && (
          <div className="mb-4 rounded-md p-3 text-sm" style={{ background: "rgba(229,62,62,0.1)", border: "1px solid rgba(229,62,62,0.3)", color: "var(--sky-accent-red)" }}>{state.error}</div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="missionId" value={mission.id} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium" style={labelStyle}>Nivel de riesgo</label>
              <select
                name="riskLevel"
                defaultValue={existing?.riskLevel ?? ""}
                className="w-full rounded-md px-3 py-2 text-sm" style={inputStyle}
              >
                <option value="">Seleccionar</option>
                {RISK_LEVELS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={labelStyle}>Tipo operacion</label>
              <select
                name="operationType"
                defaultValue={existing?.operationType ?? ""}
                className="w-full rounded-md px-3 py-2 text-sm" style={inputStyle}
              >
                <option value="">Seleccionar</option>
                {OPERATION_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" style={labelStyle}>Altitud maxima planificada</label>
            <input
              name="maxAltitude"
              type="text"
              defaultValue={existing?.maxAltitude ?? mission.maxAltitude ?? ""}
              placeholder="120m"
              className="w-full rounded-md px-3 py-2 text-sm" style={inputStyle}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" style={labelStyle}>Prevision meteorologica</label>
            <textarea
              name="weatherForecast"
              rows={2}
              defaultValue={existing?.weatherForecast ?? ""}
              placeholder="Condiciones previstas para la fecha del vuelo..."
              className="w-full rounded-md px-3 py-2 text-sm" style={inputStyle}
            />
          </div>

          {/* Checklist A.4 */}
          <div>
            <p className="mb-2 text-sm font-medium" style={labelStyle}>Checklist planificacion</p>
            <div className="space-y-1.5 rounded-md p-3" style={{ background: "var(--sky-surface-2)", border: "1px solid var(--sky-border)" }}>
              {PLANNING_CHECKLIST.map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checklist[item.key] ?? false}
                    onChange={(e) =>
                      setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))
                    }
                    className="rounded"
                  />
                  <span style={{ color: "var(--sky-text)" }}>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <input type="hidden" name="jsonData" value={JSON.stringify(checklist)} />

          {/* Firma planificador */}
          <SignaturePad
            label="Firma del planificador"
            name="signatureData"
            value={signature}
            onChange={setSignature}
          />

          {/* RP approval */}
          <div className="rounded-md p-3" style={{ background: "rgba(12,159,216,0.1)", border: "1px solid rgba(12,159,216,0.35)" }}>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="rpApproved"
                value="true"
                defaultChecked={existing?.rpApproved ?? false}
                className="rounded"
              />
              <span className="font-medium" style={{ color: "var(--sky-accent-blue)" }}>
                Aprobado por el Responsable de Operaciones (SORA)
              </span>
            </label>
            <div className="mt-3">
              <SignaturePad
                label="Firma RP"
                name="rpSignature"
                value={rpSignature}
                onChange={setRpSignature}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4" style={{ borderTop: "1px solid var(--sky-border)" }}>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium hover:opacity-80" style={{ background: "var(--sky-surface-2)", border: "1px solid var(--sky-border-2)", color: "var(--sky-text)" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !signature}
              className="rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50" style={{ background: "var(--sky-accent-blue)" }}
            >
              {isPending ? "Guardando..." : existing ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
