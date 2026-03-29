"use client";

import { useActionState, useState } from "react";
import type { Mission, Drone } from "@/lib/db/schema";
import { savePreflightForm, type ComplianceActionResult } from "../actions/compliance.actions";
import SignaturePad from "./SignaturePad";

const PREFLIGHT_CHECKLIST_A5 = [
  { key: "crew_briefing", label: "Briefing de tripulacion completado" },
  { key: "crew_fit", label: "Estado fisico/mental de la tripulacion OK" },
  { key: "authorizations", label: "Autorizaciones y permisos verificados" },
  { key: "airspace_confirmed", label: "Espacio aereo confirmado libre" },
  { key: "notam_current", label: "NOTAMs actualizados y revisados" },
  { key: "comms_check", label: "Comunicaciones verificadas" },
  { key: "emergency_procedures", label: "Procedimientos de emergencia revisados" },
  { key: "flight_zone_clear", label: "Zona de vuelo despejada y segura" },
  { key: "spectators_managed", label: "Control de espectadores establecido" },
  { key: "takeoff_landing_clear", label: "Area despegue/aterrizaje verificada" },
];

const PREFLIGHT_CHECKLIST_A6 = [
  { key: "uas_visual_inspection", label: "Inspeccion visual UAS completada" },
  { key: "propellers_ok", label: "Helices sin dano, correctamente montadas" },
  { key: "battery_charged", label: "Bateria cargada y en buen estado" },
  { key: "battery_voltage", label: "Voltaje de bateria dentro de rango" },
  { key: "gps_fix", label: "Senal GPS adquirida (>8 satelites)" },
  { key: "compass_calibrated", label: "Compas calibrado" },
  { key: "camera_payload", label: "Camara/carga util asegurada" },
  { key: "firmware_current", label: "Firmware actualizado" },
  { key: "failsafe_configured", label: "Failsafe configurado (RTH)" },
  { key: "rc_link", label: "Enlace RC verificado" },
  { key: "motors_test", label: "Test de motores completado" },
];

export default function PreFlightForm({
  mission,
  drones,
  onClose,
}: {
  mission: Mission;
  drones: Drone[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ComplianceActionResult | null, FormData>(
    savePreflightForm,
    null,
  );

  const [signature, setSignature] = useState("");
  const [checklistA5, setChecklistA5] = useState<Record<string, boolean>>({});
  const [checklistA6, setChecklistA6] = useState<Record<string, boolean>>({});

  if (state?.success) {
    onClose();
    return null;
  }

  const allChecklist = { ...checklistA5, ...checklistA6 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-gray-400">{mission.code}</p>
            <h2 className="text-lg font-semibold text-gray-900">Checklist Pre-Vuelo (A.5/A.6)</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>

        {state?.error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="missionId" value={mission.id} />

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

          {/* Weather */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Condiciones meteorologicas</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Viento (km/h)</label>
                <input name="windSpeed" type="number" step="0.1" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Temperatura (C)</label>
                <input name="temperature" type="number" step="0.1" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Precipitacion</label>
                <select name="precipitation" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                  <option value="">-</option>
                  <option value="none">Ninguna</option>
                  <option value="light">Ligera</option>
                  <option value="moderate">Moderada</option>
                  <option value="heavy">Fuerte</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Visibilidad</label>
                <select name="visibility" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                  <option value="">-</option>
                  <option value="excellent">Excelente (&gt;10km)</option>
                  <option value="good">Buena (5-10km)</option>
                  <option value="moderate">Moderada (1-5km)</option>
                  <option value="poor">Pobre (&lt;1km)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Estado espacio aereo</label>
            <select name="airspaceStatus" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="">Seleccionar</option>
              <option value="clear">Libre — sin restricciones</option>
              <option value="notam_active">NOTAM activo — coordinacion completada</option>
              <option value="restricted">Restringido — autorizacion obtenida</option>
            </select>
          </div>

          {/* Checklist A.5 — General / Personal */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">A.5 — Verificaciones generales y personal</p>
            <div className="space-y-1.5 rounded-md border border-gray-200 bg-gray-50 p-3">
              {PREFLIGHT_CHECKLIST_A5.map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checklistA5[item.key] ?? false}
                    onChange={(e) => setChecklistA5((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Checklist A.6 — UAS Technical */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">A.6 — Verificacion tecnica UAS</p>
            <div className="space-y-1.5 rounded-md border border-gray-200 bg-emerald-50 p-3">
              {PREFLIGHT_CHECKLIST_A6.map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checklistA6[item.key] ?? false}
                    onChange={(e) => setChecklistA6((prev) => ({ ...prev, [item.key]: e.target.checked }))}
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
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Guardar Pre-Vuelo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
