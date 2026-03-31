"use client";

import { useActionState } from "react";
import { createMission, updateMission, type MissionActionResult } from "../actions/mission.actions";
import type { Mission, Drone, Pilot, User } from "@/lib/db/schema";

const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
const PRIORITY_LABELS: Record<string, string> = {
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

const SORA_CLASSES = ["SAIL I", "SAIL II", "SAIL III", "SAIL IV", "SAIL V", "SAIL VI"];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {mission ? "Editar Mision" : "Nueva Mision"}
        </h2>

        {state?.error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
        )}

        <form action={formAction} className="space-y-4">
          {mission && <input type="hidden" name="id" value={mission.id} />}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nombre *</label>
            <input
              name="name"
              required
              defaultValue={mission?.name ?? ""}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Descripcion</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={mission?.description ?? ""}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Prioridad</label>
              <select
                name="priority"
                defaultValue={mission?.priority ?? "normal"}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Clase SORA</label>
              <select
                name="soraClass"
                defaultValue={mission?.soraClass ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Sin especificar</option>
                {SORA_CLASSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Piloto</label>
              <select
                name="pilotId"
                defaultValue={mission?.pilotId ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Sin asignar</option>
                {validPilots.map((p) => (
                  <option key={p.id} value={p.id}>{p.userName ?? p.id}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Drone</label>
              <select
                name="droneId"
                defaultValue={mission?.droneId ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Sin asignar</option>
                {activeDrones.map((d) => (
                  <option key={d.id} value={d.id}>{d.model} ({d.serialNumber})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Inicio programado</label>
              <input
                name="scheduledStart"
                type="datetime-local"
                defaultValue={mission?.scheduledStart ? new Date(mission.scheduledStart).toISOString().slice(0, 16) : ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Fin programado</label>
              <input
                name="scheduledEnd"
                type="datetime-local"
                defaultValue={mission?.scheduledEnd ? new Date(mission.scheduledEnd).toISOString().slice(0, 16) : ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Altitud max (m)</label>
              <input
                name="maxAltitude"
                type="number"
                step="0.1"
                defaultValue={mission?.maxAltitude ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ref. EARO</label>
              <input
                name="earoReference"
                defaultValue={mission?.earoReference ?? ""}
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
              {isPending ? "Guardando..." : mission ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
