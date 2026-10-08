/**
 * Lógica pura de coordinaciones aeronáuticas. Sin BD, sin React.
 *
 * Fechas: se trabaja en UTC a nivel de día. La fecha de vuelo es un
 * timestamptz; el límite es un "día" (00:00 UTC). Suficiente para plazos
 * de días hábiles; no se contemplan festivos (spec v1).
 */

export type CoordinationBody = "mi" | "helipuerto" | "aeropuerto" | "defensa";
export type CoordinationStatus = "pendiente" | "enviada" | "aprobada";

export type UrgencyLevel = "aprobada" | "en_plazo" | "proximo" | "urgente" | "superado";
export type GlobalLevel = "sin_coordinaciones" | "lista" | "en_plazo" | "proximo" | "urgente" | "superado" | "pasada";

export const BODY_ORDER: CoordinationBody[] = ["mi", "helipuerto", "aeropuerto", "defensa"];

export const BODY_LABELS: Record<CoordinationBody, string> = {
  mi: "Ministerio del Interior",
  helipuerto: "Helipuerto",
  aeropuerto: "Aeropuerto",
  defensa: "Defensa",
};

export const BODY_SHORT: Record<CoordinationBody, string> = {
  mi: "Ministerio",
  helipuerto: "Helipuerto",
  aeropuerto: "Aeropuerto",
  defensa: "Defensa",
};

export const BODY_DEFAULT_DAYS: Record<CoordinationBody, number> = {
  mi: 5,
  helipuerto: 10,
  aeropuerto: 20,
  defensa: 15,
};

export const DEFENSA_RANGE = { min: 11, max: 15 } as const;

export const STATUS_LABELS: Record<CoordinationStatus, string> = {
  pendiente: "Pendiente",
  enviada: "Enviada",
  aprobada: "Aprobada",
};

export const REMINDER_DAYS = [10, 5, 3, 1, 0] as const;

const DAY_MS = 86_400_000;

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function diasHabilesPermitidos(body: CoordinationBody, dias: number): boolean {
  if (body !== "defensa") return dias === BODY_DEFAULT_DAYS[body];
  return Number.isInteger(dias) && dias >= DEFENSA_RANGE.min && dias <= DEFENSA_RANGE.max;
}

/** Cuenta hacia atrás desde la fecha de vuelo saltando sábados y domingos. */
export function calcularLimite(fechaVuelo: Date, diasHabiles: number): Date {
  const d = startOfUtcDay(fechaVuelo);
  let contados = 0;
  while (contados < diasHabiles) {
    d.setUTCDate(d.getUTCDate() - 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) contados++;
  }
  return d;
}

/** Días naturales desde hoy hasta el límite (negativo si ya pasó). */
export function diasHastaLimite(limite: Date, hoy: Date = new Date()): number {
  return Math.round((startOfUtcDay(limite).getTime() - startOfUtcDay(hoy).getTime()) / DAY_MS);
}

export function urgencia(estado: CoordinationStatus, limite: Date, hoy: Date = new Date()): UrgencyLevel {
  if (estado === "aprobada") return "aprobada";
  const dias = diasHastaLimite(limite, hoy);
  if (dias < 0) return "superado";
  if (dias <= 3) return "urgente";
  if (dias <= 7) return "proximo";
  return "en_plazo";
}

const URGENCY_RANK: Record<UrgencyLevel, number> = {
  aprobada: 0,
  en_plazo: 1,
  proximo: 2,
  urgente: 3,
  superado: 3,
};

export type CoordinationInput = {
  estado: CoordinationStatus;
  diasHabiles: number;
};

export type CoordinationView<T extends CoordinationInput = CoordinationInput> = T & {
  limite: Date | null;
  urgencia: UrgencyLevel | null;
  diasRestantes: number | null;
};

export function evaluarCoordinacion<T extends CoordinationInput>(
  c: T,
  fechaVuelo: Date | null,
  hoy: Date = new Date(),
): CoordinationView<T> {
  if (!fechaVuelo) return { ...c, limite: null, urgencia: null, diasRestantes: null };
  const limite = calcularLimite(fechaVuelo, c.diasHabiles);
  return {
    ...c,
    limite,
    urgencia: urgencia(c.estado, limite, hoy),
    diasRestantes: diasHastaLimite(limite, hoy),
  };
}

export function estadoGlobal(
  coords: CoordinationInput[],
  fechaVuelo: Date | null,
  hoy: Date = new Date(),
): GlobalLevel {
  if (coords.length === 0) return "sin_coordinaciones";
  if (!fechaVuelo) return "sin_coordinaciones";
  if (startOfUtcDay(fechaVuelo).getTime() < startOfUtcDay(hoy).getTime()) return "pasada";
  if (coords.every((c) => c.estado === "aprobada")) return "lista";
  let worst: UrgencyLevel = "aprobada";
  for (const c of coords) {
    const u = urgencia(c.estado, calcularLimite(fechaVuelo, c.diasHabiles), hoy);
    if (URGENCY_RANK[u] > URGENCY_RANK[worst]) worst = u;
    else if (URGENCY_RANK[u] === URGENCY_RANK[worst] && u === "superado") worst = u;
  }
  if (worst === "aprobada") return "lista";
  return worst;
}

export type LevelMeta = { label: string; color: string; bg: string; border: string };

export const URGENCY_META: Record<UrgencyLevel, LevelMeta> = {
  aprobada: { label: "Aprobada",       color: "var(--sky-accent-green)",  bg: "rgba(0,217,126,0.14)",  border: "rgba(0,217,126,0.45)" },
  en_plazo: { label: "En plazo",       color: "var(--sky-accent-blue)",   bg: "rgba(12,159,216,0.14)", border: "rgba(12,159,216,0.45)" },
  proximo:  { label: "Próximo",        color: "var(--sky-accent-yellow)", bg: "rgba(245,197,24,0.14)", border: "rgba(245,197,24,0.45)" },
  urgente:  { label: "Urgente",        color: "var(--sky-accent-red)",    bg: "rgba(229,62,62,0.14)",  border: "rgba(229,62,62,0.45)" },
  superado: { label: "Plazo superado", color: "var(--sky-accent-red)",    bg: "rgba(229,62,62,0.18)",  border: "rgba(229,62,62,0.55)" },
};

export const GLOBAL_META: Record<GlobalLevel, LevelMeta> = {
  sin_coordinaciones: { label: "Sin coordinaciones", color: "var(--sky-muted)", bg: "var(--sky-surface-2)", border: "var(--sky-border-2)" },
  lista:    { ...URGENCY_META.aprobada, label: "Lista para volar" },
  en_plazo: URGENCY_META.en_plazo,
  proximo:  URGENCY_META.proximo,
  urgente:  URGENCY_META.urgente,
  superado: URGENCY_META.superado,
  pasada:   { label: "Pasada", color: "var(--sky-muted)", bg: "var(--sky-surface-2)", border: "var(--sky-border-2)" },
};

export function fmtLimite(d: Date | null): string {
  if (!d) return "sin fecha";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
