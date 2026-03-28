import type { Mission } from "@/lib/db/schema";

/**
 * Mission state machine — 8 estados, transiciones validadas.
 *
 * draft → planned → approved → preflight → in_flight → completed
 *                                                     → aborted
 * Cualquier estado (excepto completed) → cancelled
 */

type MissionStatus = Mission["status"];

const TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  draft: ["planned", "cancelled"],
  planned: ["approved", "cancelled"],
  approved: ["preflight", "cancelled"],
  preflight: ["in_flight", "cancelled"],
  in_flight: ["completed", "aborted"],
  completed: [],
  aborted: [],
  cancelled: [],
};

export function canTransition(from: MissionStatus, to: MissionStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function getNextStatuses(current: MissionStatus): MissionStatus[] {
  return TRANSITIONS[current] ?? [];
}

export function isTerminal(status: MissionStatus): boolean {
  return TRANSITIONS[status]?.length === 0;
}

export const STATUS_LABELS: Record<MissionStatus, string> = {
  draft: "Borrador",
  planned: "Planificada",
  approved: "Aprobada",
  preflight: "Pre-vuelo",
  in_flight: "En vuelo",
  completed: "Completada",
  aborted: "Abortada",
  cancelled: "Cancelada",
};

export const STATUS_COLORS: Record<MissionStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  planned: "bg-blue-100 text-blue-700",
  approved: "bg-indigo-100 text-indigo-700",
  preflight: "bg-yellow-100 text-yellow-700",
  in_flight: "bg-emerald-100 text-emerald-700",
  completed: "bg-green-100 text-green-700",
  aborted: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: "text-gray-500",
  normal: "text-blue-600",
  high: "text-orange-600",
  urgent: "text-red-600",
};
