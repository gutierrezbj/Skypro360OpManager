"use client";

import { useActionState } from "react";
import { createDrone, updateDrone, type DroneActionResult } from "../actions/drone.actions";
import type { Drone } from "@/lib/db/schema";

const EASA_CLASSES = ["C0", "C1", "C2", "C3", "C4", "C5", "C6"] as const;
const CATEGORIES = ["open", "specific", "certified"] as const;
const STATUSES = ["active", "maintenance", "retired", "pending_registration"] as const;

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  maintenance: "En mantenimiento",
  retired: "Retirado",
  pending_registration: "Pendiente registro",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {drone ? "Editar Drone" : "Registrar Drone"}
        </h2>

        {state?.error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
        )}

        <form action={formAction} className="space-y-4">
          {drone && <input type="hidden" name="id" value={drone.id} />}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Numero de serie *" name="serialNumber" defaultValue={drone?.serialNumber} required />
            <Field label="Modelo *" name="model" defaultValue={drone?.model} required />
            <Field label="Fabricante *" name="manufacturer" defaultValue={drone?.manufacturer} required />
            <Field label="Registro AESA" name="registrationNumber" defaultValue={drone?.registrationNumber ?? ""} />

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
              <select
                name="status"
                defaultValue={drone?.status ?? "pending_registration"}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Categoria</label>
              <select
                name="category"
                defaultValue={drone?.category ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Sin especificar</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Clase EASA</label>
              <select
                name="easaClass"
                defaultValue={drone?.easaClass ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Sin especificar</option>
                {EASA_CLASSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <Field label="MTOM (kg)" name="mtomKg" type="number" step="0.01" defaultValue={drone?.mtomKg ?? ""} />
            <Field label="Max tiempo vuelo (min)" name="maxFlightTime" type="number" defaultValue={drone?.maxFlightTime?.toString() ?? ""} />
            <Field label="Max carga (kg)" name="maxPayload" type="number" step="0.01" defaultValue={drone?.maxPayload ?? ""} />
            <Field label="Exp. seguro" name="insuranceExpiry" type="date" defaultValue={drone?.insuranceExpiry ? new Date(drone.insuranceExpiry).toISOString().split("T")[0] : ""} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
  label,
  name,
  type = "text",
  defaultValue = "",
  required = false,
  step,
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
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        step={step}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
