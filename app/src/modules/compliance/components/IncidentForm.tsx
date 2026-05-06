"use client";

import { useActionState, useState } from "react";
import type { Mission } from "@/lib/db/schema";
import { saveIncidentForm, type ComplianceActionResult } from "../actions/compliance.actions";
import SignaturePad from "./SignaturePad";
import { AlertTriangleIcon } from "@/lib/icons";

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

const inputStyle = {
  background: "var(--sky-bg)",
  border: "1px solid var(--sky-border-2)",
  color: "var(--sky-text)",
  fontFamily: "var(--font-barlow), sans-serif",
} as const;

const labelStyle = {
  color: "var(--sky-muted)",
} as const;

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
  const [noIncident, setNoIncident] = useState(false);

  if (state?.success) {
    onClose();
    return null;
  }

  const submitDisabled = isPending || !signature;
  const buttonLabel = noIncident ? "Registrar SIN INCIDENTES" : "Registrar Incidente";
  const buttonColor = noIncident ? "#00874A" : "#C53030";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl p-6 shadow-2xl"
        style={{ background: "var(--sky-surface)", border: "1px solid var(--sky-border-2)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono" style={{ color: "var(--sky-muted)" }}>{mission.code}</p>
            <h2 className="text-lg font-semibold" style={{ color: "var(--sky-text)" }}>Informe de Incidente (Anexo I)</h2>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none transition-colors"
            style={{ color: "var(--sky-muted)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--sky-text)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--sky-muted)")}
          >
            &times;
          </button>
        </div>

        {state?.error && (
          <div
            className="mb-4 rounded-md p-3 text-sm"
            style={{ background: "rgba(229,62,62,0.1)", border: "1px solid rgba(229,62,62,0.3)", color: "var(--sky-accent-red)" }}
          >
            {state.error}
          </div>
        )}

        {/* TOGGLE: Sin incidentes (declaracion formal) */}
        <button
          type="button"
          onClick={() => setNoIncident((v) => !v)}
          className="mb-4 flex w-full items-center gap-3 rounded-lg p-3 transition-all"
          style={
            noIncident
              ? { background: "rgba(0,135,74,0.1)", border: "1px solid rgba(0,135,74,0.4)" }
              : { background: "var(--sky-surface-2)", border: "1px solid var(--sky-border)" }
          }
        >
          <div
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded"
            style={
              noIncident
                ? { background: "#00874A", border: "1px solid #00874A" }
                : { background: "var(--sky-surface)", border: "1px solid var(--sky-border-2)" }
            }
          >
            {noIncident && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold" style={{ color: noIncident ? "var(--sky-accent-green)" : "var(--sky-text)" }}>
              Vuelo SIN incidentes
            </p>
            <p className="text-[11px]" style={{ color: "var(--sky-muted)" }}>
              Declaracion formal: durante la mision no se produjo ningun incidente notificable.
            </p>
          </div>
        </button>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="missionId" value={mission.id} />

          {noIncident ? (
            <>
              <input type="hidden" name="incidentType" value="none" />
              <input type="hidden" name="description" value="Sin incidentes durante la ejecucion de la mision." />
              <input type="hidden" name="aesaNotified" value="false" />
              <div
                className="rounded-md p-3 text-xs leading-relaxed"
                style={{ background: "rgba(0,135,74,0.06)", border: "1px solid rgba(0,135,74,0.25)", color: "var(--sky-muted)" }}
              >
                Vas a registrar formalmente que <strong style={{ color: "var(--sky-accent-green)" }}>no hubo incidentes</strong> durante la mision.
                Esto queda firmado en el dossier AESA.
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium" style={labelStyle}>Tipo de incidente</label>
                <select
                  name="incidentType"
                  required
                  defaultValue=""
                  className="w-full rounded-md px-3 py-2 text-sm"
                  style={inputStyle}
                >
                  <option value="" disabled>Seleccionar tipo</option>
                  {INCIDENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" style={labelStyle}>Descripcion del incidente</label>
                <textarea
                  name="description"
                  rows={4}
                  required
                  placeholder="Descripcion detallada: que ocurrio, cuando, donde, personas afectadas..."
                  className="w-full rounded-md px-3 py-2 text-sm"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" style={labelStyle}>Acciones tomadas</label>
                <textarea
                  name="actionsTaken"
                  rows={3}
                  placeholder="Medidas correctivas adoptadas inmediatamente..."
                  className="w-full rounded-md px-3 py-2 text-sm"
                  style={inputStyle}
                />
              </div>

              <div
                className="rounded-md p-3"
                style={{ background: "rgba(229,62,62,0.06)", border: "1px solid rgba(229,62,62,0.25)" }}
              >
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="aesaNotified" value="true" />
                  <span className="font-medium" style={{ color: "var(--sky-accent-red)" }}>
                    AESA notificada (obligatorio en incidentes graves)
                  </span>
                </label>
              </div>
            </>
          )}

          <div>
            <SignaturePad
              label={`Firma del informante ${noIncident ? "(declaracion sin incidentes)" : ""}`}
              name="signatureData"
              value={signature}
              onChange={setSignature}
            />
            {!signature && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px]" style={{ color: "var(--sky-accent-yellow)" }}>
                <AlertTriangleIcon className="h-3 w-3 flex-shrink-0" />
                Firma obligatoria para registrar el {noIncident ? "informe sin incidentes" : "incidente"}.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4" style={{ borderTop: "1px solid var(--sky-border)" }}>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium transition-colors"
              style={{ background: "var(--sky-surface-2)", border: "1px solid var(--sky-border-2)", color: "var(--sky-text)" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitDisabled}
              className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity"
              style={{
                background: buttonColor,
                opacity: submitDisabled ? 0.5 : 1,
                cursor: submitDisabled ? "not-allowed" : "pointer",
              }}
              title={!signature ? "Firma requerida" : ""}
            >
              {isPending ? "Guardando..." : buttonLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
