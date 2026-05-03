"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Mission } from "@/lib/db/schema";
import { transitionMission, type MissionActionResult } from "@/modules/missions/actions/mission.actions";
import { getNextStatuses, STATUS_LABELS, STATUS_HEX } from "@/modules/missions/state-machine";

type Props = {
  mission: Mission;
  /** True if A.4 (planning) form has been signed */
  hasPlanning: boolean;
  /** Number of A.5/A.6 preflight checklists signed */
  preflightCount: number;
  /** Number of A.7/A.8 postflight checklists signed */
  postflightCount: number;
  /** Number of incident reports (incl. "sin incidentes" declarations) */
  incidentCount: number;
};

/**
 * Barra inteligente que muestra el siguiente paso del lifecycle según
 * el estado actual y los formularios firmados.
 *
 * Reemplaza el flujo anterior donde había que ir a la lista de misiones
 * y pulsar el botón ojo → transición. Aquí la transición está en contexto.
 */
export default function StateTransitionBar({
  mission,
  hasPlanning,
  preflightCount,
  postflightCount,
  incidentCount,
}: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<MissionActionResult | null, FormData>(
    transitionMission,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state, router]);

  const nextStatuses = getNextStatuses(mission.status);
  const currentColor = STATUS_HEX[mission.status as keyof typeof STATUS_HEX] ?? "#3A5570";

  // ── Decidir qué transición sugerir ────────────────────────────────────────
  // Regla: la transición "principal" (azul) es la que sigue el happy path,
  // las cancelaciones/aborto son secundarias (rojas).
  type Suggestion = { to: string; label: string; cta: string; variant: "primary" | "danger" };
  const suggestions: Suggestion[] = [];
  let blockedReason: string | null = null;

  switch (mission.status) {
    case "draft":
      if (!hasPlanning) {
        blockedReason = "Completa primero el formulario A.4 — Planificación operacional.";
      } else {
        suggestions.push({ to: "planned", label: "Planificada", cta: "Marcar como planificada", variant: "primary" });
      }
      suggestions.push({ to: "cancelled", label: "Cancelada", cta: "Cancelar misión", variant: "danger" });
      break;

    case "planned":
      if (!hasPlanning) {
        blockedReason = "Falta firmar el A.4 antes de aprobar.";
      } else if (!mission.droneId || !mission.pilotId) {
        blockedReason = "Asigna drone y piloto antes de aprobar.";
      } else {
        suggestions.push({ to: "approved", label: "Aprobada", cta: "Aprobar misión", variant: "primary" });
      }
      suggestions.push({ to: "cancelled", label: "Cancelada", cta: "Cancelar misión", variant: "danger" });
      break;

    case "approved":
      suggestions.push({ to: "preflight", label: "Pre-vuelo", cta: "Iniciar pre-vuelo", variant: "primary" });
      suggestions.push({ to: "cancelled", label: "Cancelada", cta: "Cancelar misión", variant: "danger" });
      break;

    case "preflight":
      if (preflightCount === 0) {
        blockedReason = "Firma el checklist pre-vuelo (A.5/A.6) antes de despegar.";
      } else {
        suggestions.push({ to: "in_flight", label: "En vuelo", cta: "Despegar — marcar EN VUELO", variant: "primary" });
      }
      suggestions.push({ to: "cancelled", label: "Cancelada", cta: "Cancelar misión", variant: "danger" });
      break;

    case "in_flight":
      if (postflightCount === 0) {
        blockedReason = "Firma el checklist post-vuelo (A.7/A.8) y reporta el Anexo I antes de cerrar.";
      } else {
        suggestions.push({ to: "completed", label: "Completada", cta: "Marcar como COMPLETADA", variant: "primary" });
      }
      suggestions.push({ to: "aborted", label: "Abortada", cta: "Marcar misión ABORTADA", variant: "danger" });
      break;

    case "completed":
    case "aborted":
    case "cancelled":
      // Estados terminales — no hay transición posible
      break;
  }

  const isTerminal = nextStatuses.length === 0;

  return (
    <div
      className="mb-6 rounded-xl overflow-hidden"
      style={{
        border: `1px solid ${isTerminal ? "var(--sky-border)" : "rgba(12,159,216,0.3)"}`,
        background: isTerminal ? "var(--sky-surface-2)" : "var(--sky-surface)",
      }}
    >
      {/* Header con estado actual */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: `linear-gradient(90deg, ${currentColor}15 0%, transparent 100%)`, borderBottom: "1px solid var(--sky-border)" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: currentColor, boxShadow: `0 0 6px ${currentColor}` }}
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--sky-muted)" }}>
              Estado actual
            </p>
            <p className="text-sm font-semibold" style={{ color: "var(--sky-text)" }}>
              {STATUS_LABELS[mission.status as keyof typeof STATUS_LABELS] ?? mission.status}
            </p>
          </div>
        </div>
        <div className="text-right text-[10px]" style={{ color: "var(--sky-muted)" }}>
          <span style={{ color: hasPlanning ? "var(--sky-accent-green)" : "var(--sky-dim)" }}>● A.4</span>
          {"  "}
          <span style={{ color: preflightCount > 0 ? "var(--sky-accent-green)" : "var(--sky-dim)" }}>● A.5/A.6 ({preflightCount})</span>
          {"  "}
          <span style={{ color: postflightCount > 0 ? "var(--sky-accent-green)" : "var(--sky-dim)" }}>● A.7/A.8 ({postflightCount})</span>
          {"  "}
          <span style={{ color: incidentCount > 0 ? "var(--sky-accent-green)" : "var(--sky-dim)" }}>● Anexo I ({incidentCount})</span>
        </div>
      </div>

      {/* Body — siguiente paso */}
      <div className="px-4 py-4">
        {state && !state.success && state.error && (
          <div
            className="mb-3 rounded-md px-3 py-2 text-xs"
            style={{ background: "rgba(229,62,62,0.1)", border: "1px solid rgba(229,62,62,0.3)", color: "var(--sky-accent-red)" }}
          >
            {state.error}
          </div>
        )}

        {isTerminal ? (
          <p className="text-sm" style={{ color: "var(--sky-muted)" }}>
            Esta misión está en estado terminal. No hay más transiciones disponibles.
          </p>
        ) : blockedReason ? (
          <div
            className="rounded-md px-3 py-2.5 text-xs leading-relaxed"
            style={{ background: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.3)", color: "var(--sky-muted)" }}
          >
            <span style={{ color: "var(--sky-accent-yellow)", fontWeight: 600 }}>Pendiente: </span>
            {blockedReason}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs mr-2" style={{ color: "var(--sky-muted)" }}>
              Siguiente paso:
            </span>
            {suggestions.map((s) => (
              <form key={s.to} action={formAction} className="inline-block">
                <input type="hidden" name="id" value={mission.id} />
                <input type="hidden" name="status" value={s.to} />
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50"
                  style={
                    s.variant === "primary"
                      ? { background: "#0C9FD8", color: "#fff", boxShadow: "0 0 12px rgba(12,159,216,0.3)" }
                      : { background: "var(--sky-surface-2)", color: "var(--sky-accent-red)", border: "1px solid rgba(229,62,62,0.3)" }
                  }
                >
                  {isPending ? "..." : s.cta}
                </button>
              </form>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
