"use client";

import { useActionState, useState } from "react";
import type { FormPlanning, Mission } from "@/lib/db/schema";
import { savePlanningForm, type ComplianceActionResult } from "../actions/compliance.actions";
import SignaturePad from "./SignaturePad";

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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-gray-400">{mission.code}</p>
            <h2 className="text-lg font-semibold text-gray-900">Planificacion Operacional (A.4)</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>

        {state?.error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="missionId" value={mission.id} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nivel de riesgo</label>
              <select
                name="riskLevel"
                defaultValue={existing?.riskLevel ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Seleccionar</option>
                {RISK_LEVELS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tipo operacion</label>
              <select
                name="operationType"
                defaultValue={existing?.operationType ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Seleccionar</option>
                {OPERATION_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Altitud maxima planificada</label>
            <input
              name="maxAltitude"
              type="text"
              defaultValue={existing?.maxAltitude ?? mission.maxAltitude ?? ""}
              placeholder="120m"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Prevision meteorologica</label>
            <textarea
              name="weatherForecast"
              rows={2}
              defaultValue={existing?.weatherForecast ?? ""}
              placeholder="Condiciones previstas para la fecha del vuelo..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Checklist A.4 */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Checklist planificacion</p>
            <div className="space-y-1.5 rounded-md border border-gray-200 bg-gray-50 p-3">
              {PLANNING_CHECKLIST.map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checklist[item.key] ?? false}
                    onChange={(e) =>
                      setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">{item.label}</span>
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
          <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="rpApproved"
                value="true"
                defaultChecked={existing?.rpApproved ?? false}
                className="rounded border-gray-300"
              />
              <span className="font-medium text-indigo-800">
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

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !signature}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Guardando..." : existing ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
