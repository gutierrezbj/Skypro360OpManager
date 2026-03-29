"use client";

import { useActionState } from "react";
import type { Mission, Drone, Pilot } from "@/lib/db/schema";
import MissionStatusBadge from "./MissionStatusBadge";
import { getNextStatuses, STATUS_LABELS, PRIORITY_LABELS, isTerminal } from "../state-machine";
import { transitionMission, type MissionActionResult } from "../actions/mission.actions";

type PilotWithUser = Pilot & { userName?: string };

export default function MissionDetail({
  mission,
  drones,
  pilots,
  onClose,
  onEdit,
}: {
  mission: Mission;
  drones: Drone[];
  pilots: PilotWithUser[];
  onClose: () => void;
  onEdit: () => void;
}) {
  const [state, formAction, isPending] = useActionState<MissionActionResult | null, FormData>(
    transitionMission,
    null,
  );

  if (state?.success) {
    onClose();
  }

  const pilot = pilots.find((p) => p.id === mission.pilotId);
  const drone = drones.find((d) => d.id === mission.droneId);
  const nextStatuses = getNextStatuses(mission.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-mono text-gray-400">{mission.code}</p>
            <h2 className="text-lg font-semibold text-gray-900">{mission.name}</h2>
          </div>
          <MissionStatusBadge status={mission.status} />
        </div>

        {state?.error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
        )}

        {mission.description && (
          <p className="mb-4 text-sm text-gray-600">{mission.description}</p>
        )}

        <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-gray-500">Prioridad</dt>
          <dd className="font-medium">{PRIORITY_LABELS[mission.priority] ?? mission.priority}</dd>

          <dt className="text-gray-500">Piloto</dt>
          <dd className="font-medium">{pilot?.userName ?? "Sin asignar"}</dd>

          <dt className="text-gray-500">Drone</dt>
          <dd className="font-medium">{drone?.model ?? "Sin asignar"}</dd>

          {mission.soraClass && (
            <>
              <dt className="text-gray-500">SORA</dt>
              <dd className="font-medium">{mission.soraClass}</dd>
            </>
          )}

          {mission.maxAltitude && (
            <>
              <dt className="text-gray-500">Alt. max</dt>
              <dd className="font-medium">{mission.maxAltitude}m</dd>
            </>
          )}

          {mission.scheduledStart && (
            <>
              <dt className="text-gray-500">Inicio</dt>
              <dd className="font-medium">
                {new Date(mission.scheduledStart).toLocaleString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </dd>
            </>
          )}

          {mission.actualStart && (
            <>
              <dt className="text-gray-500">Inicio real</dt>
              <dd className="font-medium">
                {new Date(mission.actualStart).toLocaleString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </dd>
            </>
          )}

          {mission.actualEnd && (
            <>
              <dt className="text-gray-500">Fin real</dt>
              <dd className="font-medium">
                {new Date(mission.actualEnd).toLocaleString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </dd>
            </>
          )}
        </dl>

        {/* Transition buttons */}
        {nextStatuses.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-xs font-medium uppercase text-gray-400">Cambiar estado</p>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((ns) => (
                <form key={ns} action={formAction}>
                  <input type="hidden" name="id" value={mission.id} />
                  <input type="hidden" name="status" value={ns} />
                  <button
                    type="submit"
                    disabled={isPending}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                      ns === "cancelled" || ns === "aborted"
                        ? "border border-red-300 text-red-600 hover:bg-red-50"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    {STATUS_LABELS[ns]}
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>
          <a
            href={`/missions/${mission.id}/compliance`}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Compliance
          </a>
          {!isTerminal(mission.status) && (
            <button
              onClick={onEdit}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Editar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
