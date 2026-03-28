import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { drones, pilots } from "@/lib/db/schema";

/**
 * Shared fleet queries — usables desde cualquier módulo.
 * Solo lecturas. Sin lógica de negocio.
 */

export async function getDronesForTenant(tenantId: string, txDb: typeof db = db) {
  return txDb.select().from(drones).where(eq(drones.tenantId, tenantId));
}

export async function getDroneById(id: string, tenantId: string, txDb: typeof db = db) {
  const [drone] = await txDb
    .select()
    .from(drones)
    .where(and(eq(drones.id, id), eq(drones.tenantId, tenantId)));
  return drone ?? null;
}

export async function getActiveDrones(tenantId: string, txDb: typeof db = db) {
  return txDb
    .select()
    .from(drones)
    .where(and(eq(drones.tenantId, tenantId), eq(drones.status, "active")));
}

export async function getPilotsForTenant(tenantId: string, txDb: typeof db = db) {
  return txDb.select().from(pilots).where(eq(pilots.tenantId, tenantId));
}

export async function getPilotById(id: string, tenantId: string, txDb: typeof db = db) {
  const [pilot] = await txDb
    .select()
    .from(pilots)
    .where(and(eq(pilots.id, id), eq(pilots.tenantId, tenantId)));
  return pilot ?? null;
}

export async function getValidPilots(tenantId: string, txDb: typeof db = db) {
  return txDb
    .select()
    .from(pilots)
    .where(and(eq(pilots.tenantId, tenantId), eq(pilots.certificationStatus, "valid")));
}
