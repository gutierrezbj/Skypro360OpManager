"use client";

import { useActionState, useState } from "react";
import { createMission, updateMission, type MissionActionResult } from "../actions/mission.actions";
import type { Mission, Drone, Pilot, User } from "@/lib/db/schema";
import { parseCoordPair } from "@/lib/geo/coords";

const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
const PRIORITY_LABELS: Record<string, string> = {
  low: "Baja", normal: "Normal", high: "Alta", urgent: "Urgente",
};
const SORA_CLASSES = ["SAIL I", "SAIL II", "SAIL III", "SAIL IV", "SAIL V", "SAIL VI"];

const inputStyle = {
  background: "var(--sky-surface-2)",
  border: "1px solid var(--sky-border-2)",
  color: "var(--sky-text)",
  borderRadius: "6px",
  padding: "8px 12px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
};

const labelStyle = {
  display: "block",
  marginBottom: "4px",
  fontSize: "12px",
  fontWeight: 500,
  color: "var(--sky-muted)",
};

type PilotWithUser = Pilot & { userName?: string };

export default function MissionForm({
  mission,
  drones,
  pilots,
  users: _users, // eslint-disable-line @typescript-eslint/no-unused-vars
  onClose,
}: {
  mission?: Mission;
  drones: Drone[];
  pilots: PilotWithUser[];
  users: Pick<User, "id" | "name" | "email">[];
  onClose: () => void;
}) {
  const action = mission ? updateMission : createMission;
  const [state, formAction, isPending] = useActionState<MissionActionResult | null, FormData>(action, null);

  // Coordinates controlled — para soportar paste "lat, lng" desde Google Maps
  const [latitude, setLatitude] = useState<string>(mission?.latitude ?? "");
  const [longitude, setLongitude] = useState<string>(mission?.longitude ?? "");
  const [coordHint, setCoordHint] = useState<string>("");

  /**
   * Detecta si el clipboard tiene un par de coordenadas (decimal o DMS)
   * y rellena ambos campos en formato decimal.
   *
   * Acepta:
   *   "36.4929, -4.7715"               (decimal)
   *   "36°25'04.88"N 5°09'13.11"W"     (DMS — formato AESA / Google Maps)
   *   "36 25 4.88 N, 5 9 13.11 W"      (DMS sin símbolos)
   *
   * Si no matchea ningún par válido, deja el paste normal del input.
   */
  function handleCoordPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    const pair = parseCoordPair(text);
    if (pair) {
      e.preventDefault();
      setLatitude(String(pair.lat));
      setLongitude(String(pair.lng));
      setCoordHint("Coordenadas detectadas y rellenadas automáticamente");
      setTimeout(() => setCoordHint(""), 3000);
    }
  }

  if (state?.success) {
    onClose();
  }

  const activeDrones = drones.filter((d) => d.status === "active");
  const validPilots = pilots.filter((p) => p.certificationStatus === "valid");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div
        style={{ background: "var(--sky-surface)", border: "1px solid var(--sky-border-2)", maxHeight: "90vh" }}
        className="w-full max-w-lg overflow-y-auto rounded-xl p-6 shadow-2xl"
      >
        <h2 style={{ color: "var(--sky-text)" }} className="mb-5 text-lg font-semibold">
          {mission ? "Editar Mision" : "Nueva Mision"}
        </h2>

        {state?.error && (
          <div
            style={{ background: "rgba(229,62,62,0.08)", border: "1px solid rgba(229,62,62,0.3)", color: "#FC8181" }}
            className="mb-4 rounded-md p-3 text-sm"
          >
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          {mission && <input type="hidden" name="id" value={mission.id} />}

          <div>
            <label style={labelStyle}>Nombre *</label>
            <input name="name" required defaultValue={mission?.name ?? ""} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Descripcion</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={mission?.description ?? ""}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Prioridad</label>
              <select name="priority" defaultValue={mission?.priority ?? "normal"} style={inputStyle}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} style={{ background: "var(--sky-surface)" }}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Clase SORA</label>
              <select name="soraClass" defaultValue={mission?.soraClass ?? ""} style={inputStyle}>
                <option value="" style={{ background: "var(--sky-surface)" }}>Sin especificar</option>
                {SORA_CLASSES.map((s) => (
                  <option key={s} value={s} style={{ background: "var(--sky-surface)" }}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Piloto</label>
              <select name="pilotId" defaultValue={mission?.pilotId ?? ""} style={inputStyle}>
                <option value="" style={{ background: "var(--sky-surface)" }}>Sin asignar</option>
                {validPilots.map((p) => (
                  <option key={p.id} value={p.id} style={{ background: "var(--sky-surface)" }}>{p.userName ?? p.id}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Drone</label>
              <select name="droneId" defaultValue={mission?.droneId ?? ""} style={inputStyle}>
                <option value="" style={{ background: "var(--sky-surface)" }}>Sin asignar</option>
                {activeDrones.map((d) => (
                  <option key={d.id} value={d.id} style={{ background: "var(--sky-surface)" }}>{d.model} ({d.serialNumber})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Inicio programado</label>
              <input
                name="scheduledStart"
                type="datetime-local"
                defaultValue={mission?.scheduledStart ? new Date(mission.scheduledStart).toISOString().slice(0, 16) : ""}
                style={{ ...inputStyle }}
                className="datetime-input"
              />
            </div>

            <div>
              <label style={labelStyle}>Fin programado</label>
              <input
                name="scheduledEnd"
                type="datetime-local"
                defaultValue={mission?.scheduledEnd ? new Date(mission.scheduledEnd).toISOString().slice(0, 16) : ""}
                style={{ ...inputStyle }}
                className="datetime-input"
              />
            </div>

            <div>
              <label style={labelStyle}>Altitud max (m)</label>
              <input
                name="maxAltitude"
                type="number"
                step="0.1"
                defaultValue={mission?.maxAltitude ?? ""}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Ref. EARO</label>
              <input name="earoReference" defaultValue={mission?.earoReference ?? ""} style={inputStyle} />
            </div>

            <div className="col-span-2">
              <label style={labelStyle} className="mb-1 block text-xs font-medium uppercase tracking-wider">
                Coordenadas de operación
                <span style={{ color: "var(--sky-accent-blue)", fontWeight: 400, textTransform: "none", letterSpacing: "normal" }}>
                  {" "}(necesarias para verla en el mapa)
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="latitude"
                  type="text"
                  inputMode="decimal"
                  placeholder="Latitud (ej: 39.4699)"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  onPaste={handleCoordPaste}
                  style={inputStyle}
                />
                <input
                  name="longitude"
                  type="text"
                  inputMode="decimal"
                  placeholder="Longitud (ej: -6.3724)"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  onPaste={handleCoordPaste}
                  style={inputStyle}
                />
              </div>
              {coordHint ? (
                <p className="mt-1.5 text-[10px] font-semibold leading-relaxed" style={{ color: "var(--sky-accent-green)" }}>
                  {coordHint}
                </p>
              ) : (
                <p className="mt-1.5 text-[10px] leading-relaxed" style={{ color: "var(--sky-muted)" }}>
                  Pega desde Google Maps o de un documento AESA en cualquiera de los dos campos.
                  Acepta decimal (<code>36.4929, -4.7715</code>) y DMS (<code>36°25&apos;04&quot;N 5°09&apos;13&quot;W</code>).
                </p>
              )}
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--sky-border)" }} className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              style={{ border: "1px solid var(--sky-border-2)", color: "var(--sky-muted)" }}
              className="rounded-md px-4 py-2 text-sm font-medium hover:opacity-80"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              style={{ background: "#0C9FD8", color: "#fff" }}
              className="rounded-md px-4 py-2 text-sm font-medium hover:opacity-80 disabled:opacity-50"
            >
              {isPending ? "Guardando..." : mission ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
