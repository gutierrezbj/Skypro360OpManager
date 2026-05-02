/**
 * RBAC — Reglas de visibilidad y permisos por rol.
 *
 * Roles:
 * - admin       (SRS): ve todos los tenants, control total
 * - org_admin   (Luis): ve todo el tenant, gestiona flota/usuarios
 * - coordinator (planifica): ve todas las misiones del tenant, no edita flota
 * - pilot       (Fer): solo ve sus misiones asignadas
 * - viewer      (cliente externo): solo lectura
 */

export type UserRole = "admin" | "org_admin" | "pilot" | "coordinator" | "viewer";

// ── Visibilidad ──────────────────────────────────────────────────────────────

/** ¿Ve todas las misiones del tenant? Si no, solo ve las suyas (pilot). */
export function canSeeAllMissions(role: string): boolean {
  return ["admin", "org_admin", "coordinator", "viewer"].includes(role);
}

/** ¿Ve la pestaña Analytics? */
export function canSeeAnalytics(role: string): boolean {
  return ["admin", "org_admin", "coordinator"].includes(role);
}

// ── Acciones sobre misiones ──────────────────────────────────────────────────
// Nota: alineado con server actions — solo admin/org_admin/coordinator pueden
// crear/editar/aprobar misiones. Los pilotos las ejecutan, no las planifican.

export function canCreateMission(role: string): boolean {
  return ["admin", "org_admin", "coordinator"].includes(role);
}

export function canEditMission(role: string): boolean {
  return ["admin", "org_admin", "coordinator"].includes(role);
}

export function canDeleteMission(role: string): boolean {
  return ["admin", "org_admin"].includes(role);
}

export function canApproveMission(role: string): boolean {
  return ["admin", "org_admin", "coordinator"].includes(role);
}

/** Pilots transition states (preflight, in_flight, completed) on their own missions. */
export function canTransitionMission(role: string): boolean {
  return ["admin", "org_admin", "coordinator", "pilot"].includes(role);
}

// ── Acciones sobre flota ─────────────────────────────────────────────────────

export function canManageFleet(role: string): boolean {
  return ["admin", "org_admin"].includes(role);
}

export function canManagePilots(role: string): boolean {
  return ["admin", "org_admin"].includes(role);
}

// ── Compliance ───────────────────────────────────────────────────────────────

export function canSignCompliance(role: string): boolean {
  return ["pilot", "org_admin", "admin"].includes(role);
}

export function canGenerateDossier(role: string): boolean {
  return ["admin", "org_admin", "coordinator", "pilot"].includes(role);
}

// ── Usuarios ─────────────────────────────────────────────────────────────────

export function canManageUsers(role: string): boolean {
  return ["admin", "org_admin"].includes(role);
}

// ── Etiquetas para UI ────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<string, string> = {
  admin:       "Admin SRS",
  org_admin:   "Administrador",
  coordinator: "Coordinador",
  pilot:       "Piloto",
  viewer:      "Solo lectura",
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin:       "Acceso total a todos los tenants",
  org_admin:   "Gestiona flota, pilotos y operación del operador",
  coordinator: "Planifica y supervisa misiones del operador",
  pilot:       "Ejecuta misiones asignadas, firma compliance",
  viewer:      "Solo consulta — no edita nada",
};
