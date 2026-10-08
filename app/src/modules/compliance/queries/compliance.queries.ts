import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  formPlanning,
  formPreflight,
  formPostflight,
  formIncidents,
} from "@/lib/db/schema";

export async function getPlanningForMission(tenantId: string, missionId: string, txDb: typeof db = db) {
  const [record] = await txDb
    .select()
    .from(formPlanning)
    .where(and(eq(formPlanning.missionId, missionId), eq(formPlanning.tenantId, tenantId)));
  return record ?? null;
}

export async function getPreflightsForMission(tenantId: string, missionId: string, txDb: typeof db = db) {
  return txDb
    .select()
    .from(formPreflight)
    .where(and(eq(formPreflight.missionId, missionId), eq(formPreflight.tenantId, tenantId)));
}

export async function getPostflightsForMission(tenantId: string, missionId: string, txDb: typeof db = db) {
  return txDb
    .select()
    .from(formPostflight)
    .where(and(eq(formPostflight.missionId, missionId), eq(formPostflight.tenantId, tenantId)));
}

export async function getIncidentsForMission(tenantId: string, missionId: string, txDb: typeof db = db) {
  return txDb
    .select()
    .from(formIncidents)
    .where(and(eq(formIncidents.missionId, missionId), eq(formIncidents.tenantId, tenantId)));
}
