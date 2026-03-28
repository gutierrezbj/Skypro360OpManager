import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { missions } from "@/lib/db/schema";
import type { Mission } from "@/lib/db/schema";

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
