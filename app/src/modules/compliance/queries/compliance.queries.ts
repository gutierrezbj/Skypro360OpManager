import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  formPlanning,
  formPreflight,
  formPostflight,
  formIncidents,
  complianceTemplates,
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

export async function getActiveTemplates(tenantId: string, type?: string, txDb: typeof db = db) {
  if (type) {
    return txDb
      .select()
      .from(complianceTemplates)
      .where(
        and(
          eq(complianceTemplates.tenantId, tenantId),
          eq(complianceTemplates.isActive, true),
          eq(complianceTemplates.type, type),
        ),
      );
  }
  return txDb
    .select()
    .from(complianceTemplates)
    .where(and(eq(complianceTemplates.tenantId, tenantId), eq(complianceTemplates.isActive, true)));
}
