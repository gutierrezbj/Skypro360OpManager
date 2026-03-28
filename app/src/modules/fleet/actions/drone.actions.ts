"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, withTenantContext } from "@/lib/db";
import { drones } from "@/lib/db/schema";
import { requireRole } from "@/server/middleware/auth";
import { AuditService } from "@/modules/audit/service";
import { droneCreateSchema, droneUpdateSchema, droneStatusChangeSchema } from "../schemas/drone.schema";

export type DroneActionResult = {
  success: boolean;
  error?: string;
  data?: typeof drones.$inferSelect;
};

export async function getDrones(): Promise<typeof drones.$inferSelect[]> {
  const session = await requireRole("admin", "org_admin", "pilot", "coordinator", "viewer");
  const tenantId = session.user.tenantId;

  return withTenantContext(tenantId, async (tx) => {
    return tx.select().from(drones).where(eq(drones.tenantId, tenantId));
  });
}

export async function getDrone(id: string): Promise<typeof drones.$inferSelect | null> {
  const session = await requireRole("admin", "org_admin", "pilot", "coordinator", "viewer");
  const tenantId = session.user.tenantId;

  return withTenantContext(tenantId, async (tx) => {
    const [drone] = await tx
      .select()
      .from(drones)
      .where(and(eq(drones.id, id), eq(drones.tenantId, tenantId)));
    return drone ?? null;
  });
}

export async function createDrone(_prev: DroneActionResult | null, formData: FormData): Promise<DroneActionResult> {
  const session = await requireRole("admin", "org_admin");
  const tenantId = session.user.tenantId;

  const raw = Object.fromEntries(formData.entries());
  const parsed = droneCreateSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  const input = parsed.data;

  try {
    const result = await withTenantContext(tenantId, async (tx) => {
      const [drone] = await tx
        .insert(drones)
        .values({
          tenantId,
          serialNumber: input.serialNumber,
          model: input.model,
          manufacturer: input.manufacturer,
          registrationNumber: input.registrationNumber,
          status: input.status,
          maxFlightTime: input.maxFlightTime,
          maxPayload: input.maxPayload?.toString(),
          category: input.category,
          easaClass: input.easaClass,
          mtomKg: input.mtomKg?.toString(),
          insuranceExpiry: input.insuranceExpiry,
          specs: input.specs,
        })
        .returning();

      await AuditService.log({
        tenantId,
        userId: session.user.id,
        action: "create",
        entityType: "drone",
        entityId: drone.id,
        metadata: { serialNumber: drone.serialNumber, model: drone.model },
      }, tx);

      return drone;
    });

    revalidatePath("/fleet");
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error al crear drone" };
  }
}

export async function updateDrone(_prev: DroneActionResult | null, formData: FormData): Promise<DroneActionResult> {
  const session = await requireRole("admin", "org_admin");
  const tenantId = session.user.tenantId;

  const raw = Object.fromEntries(formData.entries());
  const parsed = droneUpdateSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  const { id, ...updates } = parsed.data;

  try {
    const result = await withTenantContext(tenantId, async (tx) => {
      // Fetch current for audit diff
      const [current] = await tx
        .select()
        .from(drones)
        .where(and(eq(drones.id, id), eq(drones.tenantId, tenantId)));

      if (!current) throw new Error("Drone no encontrado");

      const values: Record<string, unknown> = { updatedAt: new Date() };
      if (updates.serialNumber !== undefined) values.serialNumber = updates.serialNumber;
      if (updates.model !== undefined) values.model = updates.model;
      if (updates.manufacturer !== undefined) values.manufacturer = updates.manufacturer;
      if (updates.registrationNumber !== undefined) values.registrationNumber = updates.registrationNumber;
      if (updates.status !== undefined) values.status = updates.status;
      if (updates.maxFlightTime !== undefined) values.maxFlightTime = updates.maxFlightTime;
      if (updates.maxPayload !== undefined) values.maxPayload = updates.maxPayload.toString();
      if (updates.category !== undefined) values.category = updates.category;
      if (updates.easaClass !== undefined) values.easaClass = updates.easaClass;
      if (updates.mtomKg !== undefined) values.mtomKg = updates.mtomKg.toString();
      if (updates.insuranceExpiry !== undefined) values.insuranceExpiry = updates.insuranceExpiry;

      const [updated] = await tx
        .update(drones)
        .set(values)
        .where(and(eq(drones.id, id), eq(drones.tenantId, tenantId)))
        .returning();

      await AuditService.log({
        tenantId,
        userId: session.user.id,
        action: "update",
        entityType: "drone",
        entityId: id,
        changes: Object.fromEntries(
          Object.keys(updates).map((k) => [k, { old: (current as Record<string, unknown>)[k], new: (updates as Record<string, unknown>)[k] }])
        ),
      }, tx);

      return updated;
    });

    revalidatePath("/fleet");
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error al actualizar drone" };
  }
}

export async function changeDroneStatus(_prev: DroneActionResult | null, formData: FormData): Promise<DroneActionResult> {
  const session = await requireRole("admin", "org_admin");
  const tenantId = session.user.tenantId;

  const parsed = droneStatusChangeSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  try {
    const result = await withTenantContext(tenantId, async (tx) => {
      const [current] = await tx
        .select()
        .from(drones)
        .where(and(eq(drones.id, parsed.data.id), eq(drones.tenantId, tenantId)));

      if (!current) throw new Error("Drone no encontrado");

      const [updated] = await tx
        .update(drones)
        .set({ status: parsed.data.status, updatedAt: new Date() })
        .where(and(eq(drones.id, parsed.data.id), eq(drones.tenantId, tenantId)))
        .returning();

      await AuditService.log({
        tenantId,
        userId: session.user.id,
        action: "status_change",
        entityType: "drone",
        entityId: parsed.data.id,
        changes: { status: { old: current.status, new: parsed.data.status } },
      }, tx);

      return updated;
    });

    revalidatePath("/fleet");
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error al cambiar estado" };
  }
}
