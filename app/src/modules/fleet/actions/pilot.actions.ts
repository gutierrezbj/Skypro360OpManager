"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, withTenantContext } from "@/lib/db";
import { pilots } from "@/lib/db/schema";
import { requireRole } from "@/server/middleware/auth";
import { AuditService } from "@/modules/audit/service";
import { pilotCreateSchema, pilotUpdateSchema } from "../schemas/pilot.schema";

export type PilotActionResult = {
  success: boolean;
  error?: string;
  data?: typeof pilots.$inferSelect;
};

export async function getPilots(): Promise<typeof pilots.$inferSelect[]> {
  const session = await requireRole("admin", "org_admin", "pilot", "coordinator", "viewer");
  const tenantId = session.user.tenantId;

  return withTenantContext(tenantId, async (tx) => {
    return tx.select().from(pilots).where(eq(pilots.tenantId, tenantId));
  });
}

export async function getPilot(id: string): Promise<typeof pilots.$inferSelect | null> {
  const session = await requireRole("admin", "org_admin", "pilot", "coordinator", "viewer");
  const tenantId = session.user.tenantId;

  return withTenantContext(tenantId, async (tx) => {
    const [pilot] = await tx
      .select()
      .from(pilots)
      .where(and(eq(pilots.id, id), eq(pilots.tenantId, tenantId)));
    return pilot ?? null;
  });
}

export async function createPilot(_prev: PilotActionResult | null, formData: FormData): Promise<PilotActionResult> {
  const session = await requireRole("admin", "org_admin");
  const tenantId = session.user.tenantId;

  const raw = Object.fromEntries(formData.entries());
  const parsed = pilotCreateSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  const input = parsed.data;

  try {
    const result = await withTenantContext(tenantId, async (tx) => {
      const [pilot] = await tx
        .insert(pilots)
        .values({
          tenantId,
          userId: input.userId,
          licenseNumber: input.licenseNumber,
          certificationStatus: input.certificationStatus,
          certificationExpiry: input.certificationExpiry,
          medicalExpiry: input.medicalExpiry,
          flightHours: input.flightHours.toString(),
          notes: input.notes,
        })
        .returning();

      await AuditService.log({
        tenantId,
        userId: session.user.id,
        action: "create",
        entityType: "pilot",
        entityId: pilot.id,
        metadata: { linkedUserId: input.userId, licenseNumber: input.licenseNumber },
      }, tx);

      return pilot;
    });

    revalidatePath("/fleet");
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error al crear piloto" };
  }
}

export async function updatePilot(_prev: PilotActionResult | null, formData: FormData): Promise<PilotActionResult> {
  const session = await requireRole("admin", "org_admin");
  const tenantId = session.user.tenantId;

  const raw = Object.fromEntries(formData.entries());
  const parsed = pilotUpdateSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  const { id, ...updates } = parsed.data;

  try {
    const result = await withTenantContext(tenantId, async (tx) => {
      const [current] = await tx
        .select()
        .from(pilots)
        .where(and(eq(pilots.id, id), eq(pilots.tenantId, tenantId)));

      if (!current) throw new Error("Piloto no encontrado");

      const values: Record<string, unknown> = { updatedAt: new Date() };
      if (updates.userId !== undefined) values.userId = updates.userId;
      if (updates.licenseNumber !== undefined) values.licenseNumber = updates.licenseNumber;
      if (updates.certificationStatus !== undefined) values.certificationStatus = updates.certificationStatus;
      if (updates.certificationExpiry !== undefined) values.certificationExpiry = updates.certificationExpiry;
      if (updates.medicalExpiry !== undefined) values.medicalExpiry = updates.medicalExpiry;
      if (updates.flightHours !== undefined) values.flightHours = updates.flightHours.toString();
      if (updates.notes !== undefined) values.notes = updates.notes;

      const [updated] = await tx
        .update(pilots)
        .set(values)
        .where(and(eq(pilots.id, id), eq(pilots.tenantId, tenantId)))
        .returning();

      await AuditService.log({
        tenantId,
        userId: session.user.id,
        action: "update",
        entityType: "pilot",
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
    return { success: false, error: err instanceof Error ? err.message : "Error al actualizar piloto" };
  }
}
