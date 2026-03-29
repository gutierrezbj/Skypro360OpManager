"use client";

import { useActionState, useState } from "react";
import type { Mission, Drone } from "@/lib/db/schema";
import { savePostflightForm, type ComplianceActionResult } from "../actions/compliance.actions";
import SignaturePad from "./SignaturePad";

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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-gray-400">{mission.code}</p>
            <h2 className="text-lg font-semibold text-gray-900">Checklist Post-Vuelo (A.7/A.8)</h2>
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
              <label className="mb-1 block text-sm font-medium text-gray-700">UAS</label>
              <select
                name="uasId"
                defaultValue={mission.droneId ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Seleccionar</option>
                {drones.map((d) => (
                  <option key={d.id} value={d.id}>{d.model} ({d.serialNumber})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Bateria restante (%)</label>
              <input
                name="batteryRemaining"
                type="text"
                placeholder="45%"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Checklist A.7 — UAS Estado Final */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">A.7 — Estado final UAS</p>
            <div className="space-y-1.5 rounded-md border border-gray-200 bg-gray-50 p-3">
              {POSTFLIGHT_CHECKLIST_A7.map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checklistA7[item.key] ?? false}
                    onChange={(e) => setChecklistA7((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Checklist A.8 — Cierre Operaciones */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">A.8 — Cierre de operaciones</p>
            <div className="space-y-1.5 rounded-md border border-gray-200 bg-amber-50 p-3">
              {POSTFLIGHT_CHECKLIST_A8.map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checklistA8[item.key] ?? false}
                    onChange={(e) => setChecklistA8((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">{item.label}</span>
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

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !signature}
              className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Guardar Post-Vuelo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
