"use client";

import { useActionState } from "react";
import { createDrone, updateDrone, type DroneActionResult } from "../actions/drone.actions";
import type { Drone } from "@/lib/db/schema";

const EASA_CLASSES = ["C0", "C1", "C2", "C3", "C4", "C5", "C6"] as const;
const CATEGORIES = ["open", "specific", "certified"] as const;
const STATUSES = ["active", "maintenance", "retired", "pending_registration"] as const;
const STATUS_LABELS: Record<string, string> = {
  active: "Activo", maintenance: "En mantenimiento",
  retired: "Retirado", pending_registration: "Pendiente registro",
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
};

const labelStyle = {
  display: "block",
  marginBottom: "4px",
  fontSize: "12px",
  fontWeight: 500,
  color: "#4A7FA0",
};

export default function DroneForm({
  drone,
  onClose,
}: {
  drone?: Drone;
  onClose: () => void;
}) {
  const action = drone ? updateDrone : createDrone;
  const [state, formAction, isPending] = useActionState<DroneActionResult | null, FormData>(action, null);

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
          {drone ? "Editar Drone" : "Registrar Drone"}
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
          {drone && <input type="hidden" name="id" value={drone.id} />}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Numero de serie *" name="serialNumber" defaultValue={drone?.serialNumber} required />
            <Field label="Modelo *" name="model" defaultValue={drone?.model} required />
            <Field label="Fabricante *" name="manufacturer" defaultValue={drone?.manufacturer} required />
            <Field label="Registro AESA" name="registrationNumber" defaultValue={drone?.registrationNumber ?? ""} />

            <div>
              <label style={labelStyle}>Estado</label>
              <select name="status" defaultValue={drone?.status ?? "pending_registration"} style={inputStyle}>
                {STATUSES.map((s) => (
                  <option key={s} value={s} style={{ background: "#0D1520" }}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Categoria</label>
              <select name="category" defaultValue={drone?.category ?? ""} style={inputStyle}>
                <option value="" style={{ background: "#0D1520" }}>Sin especificar</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} style={{ background: "#0D1520" }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Clase EASA</label>
              <select name="easaClass" defaultValue={drone?.easaClass ?? ""} style={inputStyle}>
                <option value="" style={{ background: "#0D1520" }}>Sin especificar</option>
                {EASA_CLASSES.map((c) => (
                  <option key={c} value={c} style={{ background: "#0D1520" }}>{c}</option>
                ))}
              </select>
            </div>

            <Field label="MTOM (kg)" name="mtomKg" type="number" step="0.01" defaultValue={drone?.mtomKg ?? ""} />
            <Field label="Max tiempo vuelo (min)" name="maxFlightTime" type="number" defaultValue={drone?.maxFlightTime?.toString() ?? ""} />
            <Field label="Max carga (kg)" name="maxPayload" type="number" step="0.01" defaultValue={drone?.maxPayload ?? ""} />
            <Field
              label="Exp. seguro"
              name="insuranceExpiry"
              type="date"
              defaultValue={drone?.insuranceExpiry ? new Date(drone.insuranceExpiry).toISOString().split("T")[0] : ""}
            />
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
              {isPending ? "Guardando..." : drone ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label, name, type = "text", defaultValue = "", required = false, step,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  step?: string;
}) {
  return (
    <div>
      <label
        style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 500, color: "#4A7FA0" }}
      >
        {label}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        step={step}
        style={{
          background: "#111D2E",
          border: "1px solid #1E3A5F",
          color: "#D6E8F5",
          borderRadius: "6px",
          padding: "8px 12px",
          fontSize: "14px",
          width: "100%",
          outline: "none",
          colorScheme: "dark",
        }}
      />
    </div>
  );
}
