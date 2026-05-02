import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { missions, pilots } from "@/lib/db/schema";
import type { Mission } from "@/lib/db/schema";
import { canSeeAllMissions } from "@/lib/auth/rbac";

/**
 * Shared mission queries — usables desde cualquier módulo.
 * Solo lecturas. Sin lógica de negocio.
 */

export async function getMissionsForTenant(tenantId: string, txDb: typeof db = db) {
  return txDb
    .select()
    .from(missions)
    .where(eq(missions.tenantId, tenantId))
    .orderBy(desc(missions.createdAt));
}

/**
 * RBAC-aware: devuelve las misiones que el usuario tiene permitido ver.
 * - admin/org_admin/coordinator/viewer: todas las del tenant
 * - pilot: solo las asignadas a él (pilots.userId = userId)
 * - pilot sin ficha de piloto creada: array vacío
 */
export async function getMissionsForUser(
  args: { tenantId: string; userId: string; role: string },
  txDb: typeof db = db,
) {
  if (canSeeAllMissions(args.role)) {
    return getMissionsForTenant(args.tenantId, txDb);
  }

  // pilot: resolver pilot.id desde users.id
  const [pilotRecord] = await txDb
    .select({ id: pilots.id })
    .from(pilots)
    .where(and(eq(pilots.tenantId, args.tenantId), eq(pilots.userId, args.userId)))
    .limit(1);

  if (!pilotRecord) return [];

  return txDb
    .select()
    .from(missions)
    .where(and(
      eq(missions.tenantId, args.tenantId),
      // misiones donde es piloto principal (extender a co-piloto cuando exista)
      eq(missions.pilotId, pilotRecord.id),
    ))
    .orderBy(desc(missions.createdAt));
}

/**
 * Verifica si un usuario puede acceder a una misión concreta.
 * Útil para guards en páginas de detalle.
 */
export async function canUserAccessMission(
  args: { missionId: string; tenantId: string; userId: string; role: string },
  txDb: typeof db = db,
): Promise<boolean> {
  if (canSeeAllMissions(args.role)) {
    const m = await getMissionById(args.missionId, args.tenantId, txDb);
    return m !== null;
  }

  const [pilotRecord] = await txDb
    .select({ id: pilots.id })
    .from(pilots)
    .where(and(eq(pilots.tenantId, args.tenantId), eq(pilots.userId, args.userId)))
    .limit(1);

  if (!pilotRecord) return false;

  const [mission] = await txDb
    .select({ id: missions.id })
    .from(missions)
    .where(and(
      eq(missions.id, args.missionId),
      eq(missions.tenantId, args.tenantId),
      eq(missions.pilotId, pilotRecord.id),
    ))
    .limit(1);

  return !!mission;
}

export async function getMissionById(id: string, tenantId: string, txDb: typeof db = db) {
  const [mission] = await txDb
    .select()
    .from(missions)
    .where(and(eq(missions.id, id), eq(missions.tenantId, tenantId)));
  return mission ?? null;
}

export async function getMissionsByStatus(
  tenantId: string,
  status: Mission["status"],
  txDb: typeof db = db,
) {
  return txDb
    .select()
    .from(missions)
    .where(and(eq(missions.tenantId, tenantId), eq(missions.status, status)))
    .orderBy(desc(missions.createdAt));
}
