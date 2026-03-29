"use client";

import { useActionState, useState } from "react";
import type { Mission } from "@/lib/db/schema";
import { saveIncidentForm, type ComplianceActionResult } from "../actions/compliance.actions";
import SignaturePad from "./SignaturePad";

const INCIDENT_TYPES = [
  { value: "flyaway", label: "Flyaway (perdida de control)" },
  { value: "collision", label: "Colision" },
  { value: "injury", label: "Lesion personal" },
  { value: "property_damage", label: "Dano a propiedad" },
  { value: "airspace_violation", label: "Violacion espacio aereo" },
  { value: "equipment_failure", label: "Fallo de equipo" },
  { value: "communication_loss", label: "Perdida de comunicacion" },
  { value: "battery_emergency", label: "Emergencia bateria" },
  { value: "weather_event", label: "Evento meteorologico" },
  { value: "other", label: "Otro" },
];

export default function IncidentForm({
  mission,
  onClose,
}: {
  mission: Mission;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ComplianceActionResult | null, FormData>(
    saveIncidentForm,
    null,
  );

  const [signature, setSignature] = useState("");

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
            <h2 className="text-lg font-semibold text-gray-900">Informe de Incidente (Anexo I)</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>

        {state?.error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="missionId" value={mission.id} />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de incidente</label>
            <select
              name="incidentType"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Seleccionar tipo</option>
              {INCIDENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Descripcion del incidente</label>
            <textarea
              name="description"
              rows={4}
              required
              placeholder="Descripcion detallada: que ocurrio, cuando, donde, personas afectadas..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Acciones tomadas</label>
            <textarea
              name="actionsTaken"
              rows={3}
              placeholder="Medidas correctivas adoptadas inmediatamente..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="aesaNotified"
                value="true"
                className="rounded border-gray-300"
              />
              <span className="font-medium text-red-800">
                AESA notificada (obligatorio en incidentes graves)
              </span>
            </label>
          </div>

          <SignaturePad
            label="Firma del informante"
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
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Registrar Incidente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
