import { eq, and, inArray, ne, notInArray, isNotNull, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { missionCoordinations, missions } from "@/lib/db/schema";

export async function getCoordinationsForMission(tenantId: string, missionId: string, txDb: typeof db = db) {
  return txDb
    .select()
    .from(missionCoordinations)
    .where(and(eq(missionCoordinations.tenantId, tenantId), eq(missionCoordinations.missionId, missionId)))
    .orderBy(asc(missionCoordinations.createdAt));
}

export async function getCoordinationsForMissions(tenantId: string, missionIds: string[], txDb: typeof db = db) {
  if (missionIds.length === 0) return [];
  return txDb
    .select()
    .from(missionCoordinations)
    .where(and(eq(missionCoordinations.tenantId, tenantId), inArray(missionCoordinations.missionId, missionIds)));
}

/**
 * Coordinaciones no aprobadas de misiones futuras y no terminales, con la
 * fecha de vuelo. Base del panel "Pendientes de coordinar" y del cron de
 * recordatorios.
 */
export async function getOpenCoordinationsWithMission(tenantId: string, txDb: typeof db = db) {
  return txDb
    .select({
      coordination: missionCoordinations,
      mission: {
        id: missions.id,
        code: missions.code,
        name: missions.name,
        status: missions.status,
        scheduledStart: missions.scheduledStart,
        coordinatorId: missions.coordinatorId,
      },
    })
    .from(missionCoordinations)
    .innerJoin(missions, eq(missionCoordinations.missionId, missions.id))
    .where(and(
      eq(missionCoordinations.tenantId, tenantId),
      ne(missionCoordinations.estado, "aprobada"),
      isNotNull(missions.scheduledStart),
      notInArray(missions.status, ["completed", "aborted", "cancelled"]),
    ));
}
