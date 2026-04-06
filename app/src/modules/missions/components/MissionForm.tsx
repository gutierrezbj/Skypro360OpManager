"use client";

import { useActionState } from "react";
import { createMission, updateMission, type MissionActionResult } from "../actions/mission.actions";
import type { Mission, Drone, Pilot, User } from "@/lib/db/schema";

const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
const PRIORITY_LABELS: Record<string, string> = {
  low: "Baja", normal: "Normal", high: "Alta", urgent: "Urgente",
};
const SORA_CLASSES = ["SAIL I", "SAIL II", "SAIL III", "SAIL IV", "SAIL V", "SAIL VI"];

const inputStyle = {
  background: "#111D2E",
  border: "1px solid #1E3A5F",
  color: "#D6E8F5",
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
  color: "#4A7FA0",
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

  if (state?.success) {
    onClose();
  }

  const activeDrones = drones.filter((d) => d.status === "active");
  const validPilots = pilots.filter((p) => p.certificationStatus === "valid");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div
        style={{ background: "#0D1520", border: "1px solid #1E3A5F", maxHeight: "90vh" }}
        className="w-full max-w-lg overflow-y-auto rounded-xl p-6 shadow-2xl"
      >
        <h2 style={{ color: "#D6E8F5" }} className="mb-5 text-lg font-semibold">
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
                  <option key={p} value={p} style={{ background: "#0D1520" }}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Clase SORA</label>
              <select name="soraClass" defaultValue={mission?.soraClass ?? ""} style={inputStyle}>
                <option value="" style={{ background: "#0D1520" }}>Sin especificar</option>
                {SORA_CLASSES.map((s) => (
                  <option key={s} value={s} style={{ background: "#0D1520" }}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Piloto</label>
              <select name="pilotId" defaultValue={mission?.pilotId ?? ""} style={inputStyle}>
                <option value="" style={{ background: "#0D1520" }}>Sin asignar</option>
                {validPilots.map((p) => (
                  <option key={p.id} value={p.id} style={{ background: "#0D1520" }}>{p.userName ?? p.id}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Drone</label>
              <select name="droneId" defaultValue={mission?.droneId ?? ""} style={inputStyle}>
                <option value="" style={{ background: "#0D1520" }}>Sin asignar</option>
                {activeDrones.map((d) => (
                  <option key={d.id} value={d.id} style={{ background: "#0D1520" }}>{d.model} ({d.serialNumber})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Inicio programado</label>
              <input
                name="scheduledStart"
                type="datetime-local"
                defaultValue={mission?.scheduledStart ? new Date(mission.scheduledStart).toISOString().slice(0, 16) : ""}
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>

            <div>
              <label style={labelStyle}>Fin programado</label>
              <input
                name="scheduledEnd"
                type="datetime-local"
                defaultValue={mission?.scheduledEnd ? new Date(mission.scheduledEnd).toISOString().slice(0, 16) : ""}
                style={{ ...inputStyle, colorScheme: "dark" }}
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
          </div>

          <div style={{ borderTop: "1px solid #162338" }} className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              style={{ border: "1px solid #1E3A5F", color: "#4A7FA0" }}
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
