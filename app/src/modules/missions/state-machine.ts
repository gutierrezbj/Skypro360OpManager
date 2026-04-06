import type { Mission } from "@/lib/db/schema";

/**
 * Mission state machine — 8 estados, transiciones validadas.
 *
 * draft → planned → approved → preflight → in_flight → completed
 *                                                     → aborted
 * Cualquier estado (excepto completed/aborted) → cancelled
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
  draft:      "Borrador",
  planned:    "Planificada",
  approved:   "Aprobada",
  preflight:  "Pre-vuelo",
  in_flight:  "En vuelo",
  completed:  "Completada",
  aborted:    "Abortada",
  cancelled:  "Cancelada",
};

// Cockpit dark theme — SRS Identity Sprint Skypro360
export const STATUS_COLORS: Record<MissionStatus, string> = {
  draft:      "bg-[#3A5570]/20 text-[#6A9AB0] border border-[#3A5570]/40",
  planned:    "bg-[#4A8FD4]/15 text-[#4A8FD4] border border-[#4A8FD4]/30",
  approved:   "bg-[#0C9FD8]/15 text-[#0C9FD8] border border-[#0C9FD8]/30",
  preflight:  "bg-[#F5C518]/12 text-[#F5C518] border border-[#F5C518]/30",
  in_flight:  "bg-[#00D97E]/12 text-[#00D97E] border border-[#00D97E]/30",
  completed:  "bg-[#2ECC71]/12 text-[#2ECC71] border border-[#2ECC71]/30",
  aborted:    "bg-[#E53E3E]/12 text-[#E53E3E] border border-[#E53E3E]/30",
  cancelled:  "bg-[#3A5570]/20 text-[#6A9AB0] border border-[#3A5570]/40",
};

// Hex values for use in non-Tailwind contexts (canvas, inline styles)
export const STATUS_HEX: Record<MissionStatus, string> = {
  draft:      "#3A5570",
  planned:    "#4A8FD4",
  approved:   "#0C9FD8",
  preflight:  "#F5C518",
  in_flight:  "#00D97E",
  completed:  "#2ECC71",
  aborted:    "#E53E3E",
  cancelled:  "#3A5570",
};

export const PRIORITY_LABELS: Record<string, string> = {
  low:    "Baja",
  normal: "Normal",
  high:   "Alta",
  urgent: "Urgente",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low:    "text-sky-muted",
  normal: "text-sky-text",
  high:   "text-sky-orange",
  urgent: "text-[#E53E3E]",
};
