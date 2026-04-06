"use client";

import { useActionState } from "react";
import { createPilot, updatePilot, type PilotActionResult } from "../actions/pilot.actions";
import type { Pilot, User } from "@/lib/db/schema";

const CERT_STATUSES = ["valid", "expired", "suspended", "pending"] as const;
const CERT_LABELS: Record<string, string> = {
  valid: "Valido", expired: "Expirado", suspended: "Suspendido", pending: "Pendiente",
};

const inputStyle = {
  background: "#111D2E",
  border: "1px solid #1E3A5F",
  color: "#D6E8F5",
  borderRadius: "6px",
  padding: "8px 12px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
  colorScheme: "dark" as const,
};

export default function PilotForm({
  pilot,
  users,
  onClose,
}: {
  pilot?: Pilot;
  users: Pick<User, "id" | "name" | "email">[];
  onClose: () => void;
}) {
  const action = pilot ? updatePilot : createPilot;
  const [state, formAction, isPending] = useActionState<PilotActionResult | null, FormData>(action, null);

  if (state?.success) {
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div
        style={{ background: "#0D1520", border: "1px solid #1E3A5F", maxHeight: "90vh" }}
        className="w-full max-w-lg overflow-y-auto rounded-xl p-6 shadow-2xl"
      >
        <h2 style={{ color: "#D6E8F5" }} className="mb-5 text-lg font-semibold">
          {pilot ? "Editar Piloto" : "Registrar Piloto"}
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
          {pilot && <input type="hidden" name="id" value={pilot.id} />}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 500, color: "#4A7FA0" }}>
                Usuario *
              </label>
              <select name="userId" defaultValue={pilot?.userId ?? ""} required style={inputStyle}>
                <option value="" style={{ background: "#0D1520" }}>Seleccionar usuario...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id} style={{ background: "#0D1520" }}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 500, color: "#4A7FA0" }}>
                N. Licencia
              </label>
              <input name="licenseNumber" defaultValue={pilot?.licenseNumber ?? ""} style={inputStyle} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 500, color: "#4A7FA0" }}>
                Estado certificacion
              </label>
              <select name="certificationStatus" defaultValue={pilot?.certificationStatus ?? "pending"} style={inputStyle}>
                {CERT_STATUSES.map((s) => (
                  <option key={s} value={s} style={{ background: "#0D1520" }}>{CERT_LABELS[s]}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 500, color: "#4A7FA0" }}>
                Exp. certificacion
              </label>
              <input
                name="certificationExpiry"
                type="date"
                defaultValue={pilot?.certificationExpiry ? new Date(pilot.certificationExpiry).toISOString().split("T")[0] : ""}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 500, color: "#4A7FA0" }}>
                Exp. medico
              </label>
              <input
                name="medicalExpiry"
                type="date"
                defaultValue={pilot?.medicalExpiry ? new Date(pilot.medicalExpiry).toISOString().split("T")[0] : ""}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 500, color: "#4A7FA0" }}>
                Horas vuelo
              </label>
              <input
                name="flightHours"
                type="number"
                step="0.1"
                min="0"
                defaultValue={pilot?.flightHours ?? "0"}
                style={inputStyle}
              />
            </div>

            <div className="col-span-2">
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 500, color: "#4A7FA0" }}>
                Notas
              </label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={pilot?.notes ?? ""}
                style={{ ...inputStyle, resize: "vertical" }}
              />
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
              {isPending ? "Guardando..." : pilot ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
