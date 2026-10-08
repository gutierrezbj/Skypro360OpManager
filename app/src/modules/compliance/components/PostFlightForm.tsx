"use client";

import { useActionState, useState } from "react";
import type { Mission, Drone } from "@/lib/db/schema";
import { savePostflightForm, type ComplianceActionResult } from "../actions/compliance.actions";
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

const POSTFLIGHT_CHECKLIST_A7 = [
  { key: "uas_landed_safely", label: "UAS aterrizado de forma segura" },
  { key: "structure_inspection", label: "Estructura del UAS inspeccionada" },
  { key: "propellers_condition", label: "Estado de helices revisado" },
  { key: "motors_inspection", label: "Motores sin anomalias" },
  { key: "payload_secured", label: "Carga util retirada y asegurada" },
  { key: "battery_removed", label: "Bateria retirada y almacenada correctamente" },
  { key: "damage_detected", label: "Sin danos detectados (desmarcar si hay danos)" },
  { key: "uas_stored", label: "UAS guardado en su estuche/caja" },
];

const POSTFLIGHT_CHECKLIST_A8 = [
  { key: "atsp_notified", label: "ATSP notificado del fin de operaciones" },
  { key: "flight_times_recorded", label: "Tiempos de vuelo registrados" },
  { key: "data_downloaded", label: "Datos de vuelo descargados" },
  { key: "media_backed_up", label: "Fotos/video respaldados" },
  { key: "area_cleared", label: "Zona de operaciones despejada" },
  { key: "safety_equipment_collected", label: "Equipo de seguridad recogido" },
  { key: "incidents_documented", label: "Incidencias documentadas (si aplica)" },
  { key: "debrief_completed", label: "Debrief de equipo completado" },
];

export default function PostFlightForm({
  mission,
  drones,
  onClose,
}: {
  mission: Mission;
  drones: Drone[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ComplianceActionResult | null, FormData>(
    savePostflightForm,
    null,
  );

  const [signature, setSignature] = useState("");
  const [checklistA7, setChecklistA7] = useState<Record<string, boolean>>({});
  const [checklistA8, setChecklistA8] = useState<Record<string, boolean>>({});

  if (state?.success) {
    onClose();
    return null;
  }

  const allChecklist = { ...checklistA7, ...checklistA8 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg p-6 shadow-xl" style={{ background: "var(--sky-surface)", border: "1px solid var(--sky-border-2)" }}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono" style={labelStyle}>{mission.code}</p>
            <h2 className="text-lg font-semibold" style={{ color: "var(--sky-text)" }}>Checklist Post-Vuelo (A.7/A.8)</h2>
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
              <label className="mb-1 block text-sm font-medium" style={labelStyle}>UAS</label>
              <select
                name="uasId"
                defaultValue={mission.droneId ?? ""}
                className="w-full rounded-md px-3 py-2 text-sm" style={inputStyle}
              >
                <option value="">Seleccionar</option>
                {drones.map((d) => (
                  <option key={d.id} value={d.id}>{d.model} ({d.serialNumber})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={labelStyle}>Bateria restante (%)</label>
              <input
                name="batteryRemaining"
                type="text"
                placeholder="45%"
                className="w-full rounded-md px-3 py-2 text-sm" style={inputStyle}
              />
            </div>
          </div>

          {/* Checklist A.7 — UAS Estado Final */}
          <div>
            <p className="mb-2 text-sm font-medium" style={labelStyle}>A.7 — Estado final UAS</p>
            <div className="space-y-1.5 rounded-md p-3" style={{ background: "var(--sky-surface-2)", border: "1px solid var(--sky-border)" }}>
              {POSTFLIGHT_CHECKLIST_A7.map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checklistA7[item.key] ?? false}
                    onChange={(e) => setChecklistA7((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                    className="rounded"
                  />
                  <span style={{ color: "var(--sky-text)" }}>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Checklist A.8 — Cierre Operaciones */}
          <div>
            <p className="mb-2 text-sm font-medium" style={labelStyle}>A.8 — Cierre de operaciones</p>
            <div className="space-y-1.5 rounded-md p-3" style={{ background: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.35)" }}>
              {POSTFLIGHT_CHECKLIST_A8.map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checklistA8[item.key] ?? false}
                    onChange={(e) => setChecklistA8((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                    className="rounded"
                  />
                  <span style={{ color: "var(--sky-text)" }}>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <input type="hidden" name="jsonData" value={JSON.stringify(allChecklist)} />

          <SignaturePad
            label="Firma del piloto"
            name="signatureData"
            value={signature}
            onChange={setSignature}
          />

          <div className="flex justify-end gap-3 pt-4" style={{ borderTop: "1px solid var(--sky-border)" }}>
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium hover:opacity-80" style={{ background: "var(--sky-surface-2)", border: "1px solid var(--sky-border-2)", color: "var(--sky-text)" }}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !signature}
              className="rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50" style={{ background: "var(--sky-accent-yellow)" }}
            >
              {isPending ? "Guardando..." : "Guardar Post-Vuelo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
