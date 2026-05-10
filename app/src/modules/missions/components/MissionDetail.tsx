"use client";

import { useActionState, useState } from "react";
import type { Mission, Drone, Pilot } from "@/lib/db/schema";
import MissionStatusBadge from "./MissionStatusBadge";
import { getNextStatuses, STATUS_LABELS, PRIORITY_LABELS, isTerminal } from "../state-machine";
import { transitionMission, deleteMission, type MissionActionResult } from "../actions/mission.actions";

type PilotWithUser = Pilot & { userName?: string };

export default function MissionDetail({
  mission,
  drones,
  pilots,
  onClose,
  onEdit,
  canDelete = false,
}: {
  mission: Mission;
  drones: Drone[];
  pilots: PilotWithUser[];
  onClose: () => void;
  onEdit?: () => void;
  /** Solo true para admin / org_admin */
  canDelete?: boolean;
}) {
  const [state, formAction, isPending] = useActionState<MissionActionResult | null, FormData>(
    transitionMission,
    null,
  );
  const [delState, delFormAction, delPending] = useActionState<MissionActionResult | null, FormData>(
    deleteMission,
    null,
  );
  const [confirming, setConfirming] = useState(false);

  if (state?.success || delState?.success) {
    onClose();
  }

  const pilot = pilots.find((p) => p.id === mission.pilotId);
  const drone = drones.find((d) => d.id === mission.droneId);
  const nextStatuses = getNextStatuses(mission.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div
        style={{ background: "var(--sky-surface)", border: "1px solid var(--sky-border-2)" }}
        className="w-full max-w-md rounded-xl p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p style={{ color: "#0C9FD8", fontFamily: "var(--font-jetbrains-mono, monospace)" }} className="text-xs">
              {mission.code}
            </p>
            <h2 style={{ color: "var(--sky-text)" }} className="text-lg font-semibold">{mission.name}</h2>
          </div>
          <MissionStatusBadge status={mission.status} />
        </div>

        {state?.error && (
          <div
            style={{ background: "rgba(229,62,62,0.08)", border: "1px solid rgba(229,62,62,0.3)", color: "#FC8181" }}
            className="mb-4 rounded-md p-3 text-sm"
          >
            {state.error}
          </div>
        )}

        {mission.description && (
          <p style={{ color: "var(--sky-muted)" }} className="mb-4 text-sm">{mission.description}</p>
        )}

        <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt style={{ color: "var(--sky-muted)" }}>Prioridad</dt>
          <dd style={{ color: "var(--sky-text)" }} className="font-medium">{PRIORITY_LABELS[mission.priority] ?? mission.priority}</dd>

          <dt style={{ color: "var(--sky-muted)" }}>Piloto</dt>
          <dd style={{ color: "var(--sky-text)" }} className="font-medium">{pilot?.userName ?? "Sin asignar"}</dd>

          <dt style={{ color: "var(--sky-muted)" }}>Drone</dt>
          <dd style={{ color: "var(--sky-text)" }} className="font-medium">{drone?.model ?? "Sin asignar"}</dd>

          {mission.soraClass && (
            <>
              <dt style={{ color: "var(--sky-muted)" }}>SORA</dt>
              <dd style={{ color: "var(--sky-text)" }} className="font-medium">{mission.soraClass}</dd>
            </>
          )}

          {mission.maxAltitude && (
            <>
              <dt style={{ color: "var(--sky-muted)" }}>Alt. max</dt>
              <dd style={{ color: "var(--sky-text)" }} className="font-medium">{mission.maxAltitude}m</dd>
            </>
          )}

          {mission.scheduledStart && (
            <>
              <dt style={{ color: "var(--sky-muted)" }}>Inicio</dt>
              <dd style={{ color: "var(--sky-text)" }} className="font-medium">
                {new Date(mission.scheduledStart).toLocaleString("es-ES", {
                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                })}
              </dd>
            </>
          )}

          {mission.actualStart && (
            <>
              <dt style={{ color: "var(--sky-muted)" }}>Inicio real</dt>
              <dd style={{ color: "var(--sky-text)" }} className="font-medium">
                {new Date(mission.actualStart).toLocaleString("es-ES", {
                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                })}
              </dd>
            </>
          )}

          {mission.actualEnd && (
            <>
              <dt style={{ color: "var(--sky-muted)" }}>Fin real</dt>
              <dd style={{ color: "var(--sky-text)" }} className="font-medium">
                {new Date(mission.actualEnd).toLocaleString("es-ES", {
                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                })}
              </dd>
            </>
          )}
        </dl>

        {/* Transition buttons */}
        {nextStatuses.length > 0 && (
          <div className="mb-4 space-y-2">
            <p style={{ color: "var(--sky-muted)" }} className="text-xs font-medium uppercase tracking-wider">
              Cambiar estado
            </p>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((ns) => (
                <form key={ns} action={formAction}>
                  <input type="hidden" name="id" value={mission.id} />
                  <input type="hidden" name="status" value={ns} />
                  <button
                    type="submit"
                    disabled={isPending}
                    style={
                      ns === "cancelled" || ns === "aborted"
                        ? { border: "1px solid rgba(229,62,62,0.4)", color: "#FC8181", background: "rgba(229,62,62,0.06)" }
                        : { border: "1px solid rgba(12,159,216,0.3)", color: "#0C9FD8", background: "rgba(12,159,216,0.08)" }
                    }
                    className="rounded-md px-3 py-1.5 text-sm font-medium transition-opacity disabled:opacity-50 hover:opacity-80"
                  >
                    {STATUS_LABELS[ns]}
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}

        {/* Banner de error de borrado */}
        {delState && !delState.success && delState.error && (
          <div
            className="mt-3 rounded-lg px-3 py-2 text-xs font-semibold"
            style={{
              background: "rgba(229,62,62,0.12)",
              border: "1px solid rgba(229,62,62,0.4)",
              color: "var(--sky-accent-red)",
            }}
          >
            {delState.error}
          </div>
        )}

        {/* Confirmación de borrado en lugar de botones normales */}
        {confirming ? (
          <div
            style={{ borderTop: "1px solid var(--sky-border)" }}
            className="flex flex-col gap-3 pt-4"
          >
            <p className="text-sm font-semibold" style={{ color: "var(--sky-accent-red)" }}>
              ¿Borrar la misión {mission.code} de forma permanente?
            </p>
            <p className="text-xs" style={{ color: "var(--sky-muted)" }}>
              Se eliminarán también sus formularios A.4–A.8 e incidentes asociados. Los logs de
              vuelo quedan huérfanos para auditoría. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirming(false)}
                disabled={delPending}
                style={{ border: "1px solid var(--sky-border-2)", color: "var(--sky-muted)" }}
                className="rounded-md px-4 py-2 text-sm font-medium hover:opacity-80 disabled:opacity-50"
              >
                Cancelar
              </button>
              <form action={delFormAction}>
                <input type="hidden" name="id" value={mission.id} />
                <button
                  type="submit"
                  disabled={delPending}
                  style={{ background: "#C53030", color: "#fff" }}
                  className="rounded-md px-4 py-2 text-sm font-medium hover:opacity-80 disabled:opacity-50"
                >
                  {delPending ? "Borrando…" : "Sí, borrar definitivamente"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div style={{ borderTop: "1px solid var(--sky-border)" }} className="flex justify-end gap-3 pt-4">
            {canDelete && (
              <button
                onClick={() => setConfirming(true)}
                disabled={isPending}
                style={{ background: "rgba(197,48,48,0.10)", color: "var(--sky-accent-red)", border: "1px solid rgba(197,48,48,0.35)" }}
                className="mr-auto rounded-md px-3 py-2 text-sm font-medium hover:opacity-80"
                title="Borrar misión (solo admin)"
              >
                Borrar
              </button>
            )}
            <button
              onClick={onClose}
              style={{ border: "1px solid var(--sky-border-2)", color: "var(--sky-muted)" }}
              className="rounded-md px-4 py-2 text-sm font-medium hover:opacity-80"
            >
              Cerrar
            </button>
            <a
              href={`/missions/${mission.id}/compliance`}
              style={{ background: "rgba(12,159,216,0.1)", color: "#0C9FD8", border: "1px solid rgba(12,159,216,0.25)" }}
              className="rounded-md px-4 py-2 text-sm font-medium hover:opacity-80"
            >
              Compliance
            </a>
            {!isTerminal(mission.status) && onEdit && (
              <button
                onClick={onEdit}
                style={{ background: "#0C9FD8", color: "#fff" }}
                className="rounded-md px-4 py-2 text-sm font-medium hover:opacity-80"
              >
                Editar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
