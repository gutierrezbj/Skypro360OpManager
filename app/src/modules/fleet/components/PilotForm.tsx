"use client";

import { useActionState } from "react";
import { createPilot, updatePilot, type PilotActionResult } from "../actions/pilot.actions";
import type { Pilot, User } from "@/lib/db/schema";

const CERT_STATUSES = ["valid", "expired", "suspended", "pending"] as const;
const CERT_LABELS: Record<string, string> = {
  valid: "Valido",
  expired: "Expirado",
  suspended: "Suspendido",
  pending: "Pendiente",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {pilot ? "Editar Piloto" : "Registrar Piloto"}
        </h2>

        {state?.error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
        )}

        <form action={formAction} className="space-y-4">
          {pilot && <input type="hidden" name="id" value={pilot.id} />}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Usuario *</label>
              <select
                name="userId"
                defaultValue={pilot?.userId ?? ""}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Seleccionar usuario...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">N. Licencia</label>
              <input
                name="licenseNumber"
                defaultValue={pilot?.licenseNumber ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Estado certificacion</label>
              <select
                name="certificationStatus"
                defaultValue={pilot?.certificationStatus ?? "pending"}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {CERT_STATUSES.map((s) => (
                  <option key={s} value={s}>{CERT_LABELS[s]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Exp. certificacion</label>
              <input
                name="certificationExpiry"
                type="date"
                defaultValue={pilot?.certificationExpiry ? new Date(pilot.certificationExpiry).toISOString().split("T")[0] : ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Exp. medico</label>
              <input
                name="medicalExpiry"
                type="date"
                defaultValue={pilot?.medicalExpiry ? new Date(pilot.medicalExpiry).toISOString().split("T")[0] : ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Horas vuelo</label>
              <input
                name="flightHours"
                type="number"
                step="0.1"
                min="0"
                defaultValue={pilot?.flightHours ?? "0"}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={pilot?.notes ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
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
              {isPending ? "Guardando..." : pilot ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
