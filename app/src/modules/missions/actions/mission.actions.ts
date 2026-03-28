"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, withTenantContext } from "@/lib/db";
import { missions } from "@/lib/db/schema";
import { requireRole } from "@/server/middleware/auth";
import { AuditService } from "@/modules/audit/service";
import { missionCreateSchema, missionUpdateSchema, missionTransitionSchema } from "../schemas/mission.schema";
import { canTransition } from "../state-machine";

export type MissionActionResult = {
  success: boolean;
  error?: string;
};

async function generateMissionCode(tenantId: string, tx: typeof db): Promise<string> {
  const year = new Date().getFullYear();
  const [row] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(missions)
    .where(eq(missions.tenantId, tenantId));
  const seq = (row?.count ?? 0) + 1;
  return `SKY-${year}-${String(seq).padStart(3, "0")}`;
}

export async function createMission(
  _prev: MissionActionResult | null,
  formData: FormData,
): Promise<MissionActionResult> {
  const session = await requireRole("admin", "org_admin", "coordinator");
  const tenantId = session.user.tenantId;

  const raw = Object.fromEntries(formData.entries());
  const parsed = missionCreateSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  const input = parsed.data;

  try {
    await withTenantContext(tenantId, async (tx) => {
      const code = await generateMissionCode(tenantId, tx);

      const [mission] = await tx
        .insert(missions)
        .values({
          tenantId,
          code,
          name: input.name,
          description: input.description,
          priority: input.priority,
          status: "draft",
          pilotId: input.pilotId,
          droneId: input.droneId,
          coordinatorId: input.coordinatorId,
          latitude: input.latitude,
          longitude: input.longitude,
          scheduledStart: input.scheduledStart,
          scheduledEnd: input.scheduledEnd,
          soraClass: input.soraClass,
          earoReference: input.earoReference,
          maxAltitude: input.maxAltitude?.toString(),
        })
        .returning();

      await AuditService.log(
        {
          tenantId,
          userId: session.user.id,
          action: "create",
          entityType: "mission",
          entityId: mission.id,
          metadata: { code, name: input.name },
        },
        tx,
      );
    });

    revalidatePath("/missions");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error al crear mision" };
  }
}

export async function updateMission(
  _prev: MissionActionResult | null,
  formData: FormData,
): Promise<MissionActionResult> {
  const session = await requireRole("admin", "org_admin", "coordinator");
  const tenantId = session.user.tenantId;

  const raw = Object.fromEntries(formData.entries());
  const parsed = missionUpdateSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  const { id, ...updates } = parsed.data;

  try {
    await withTenantContext(tenantId, async (tx) => {
      const [current] = await tx
        .select()
        .from(missions)
        .where(and(eq(missions.id, id), eq(missions.tenantId, tenantId)));

      if (!current) throw new Error("Mision no encontrada");

      const values: Record<string, unknown> = { updatedAt: new Date() };
      if (updates.name !== undefined) values.name = updates.name;
      if (updates.description !== undefined) values.description = updates.description;
      if (updates.priority !== undefined) values.priority = updates.priority;
      if (updates.pilotId !== undefined) values.pilotId = updates.pilotId;
      if (updates.droneId !== undefined) values.droneId = updates.droneId;
      if (updates.coordinatorId !== undefined) values.coordinatorId = updates.coordinatorId;
      if (updates.latitude !== undefined) values.latitude = updates.latitude;
      if (updates.longitude !== undefined) values.longitude = updates.longitude;
      if (updates.scheduledStart !== undefined) values.scheduledStart = updates.scheduledStart;
      if (updates.scheduledEnd !== undefined) values.scheduledEnd = updates.scheduledEnd;
      if (updates.soraClass !== undefined) values.soraClass = updates.soraClass;
      if (updates.earoReference !== undefined) values.earoReference = updates.earoReference;
      if (updates.maxAltitude !== undefined) values.maxAltitude = updates.maxAltitude?.toString();

      await tx
        .update(missions)
        .set(values)
        .where(and(eq(missions.id, id), eq(missions.tenantId, tenantId)));

      await AuditService.log(
        {
          tenantId,
          userId: session.user.id,
          action: "update",
          entityType: "mission",
          entityId: id,
          changes: Object.fromEntries(
            Object.keys(updates).map((k) => [
              k,
              { old: (current as Record<string, unknown>)[k], new: (updates as Record<string, unknown>)[k] },
            ]),
          ),
        },
        tx,
      );
    });

    revalidatePath("/missions");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error al actualizar mision" };
  }
}

export async function transitionMission(
  _prev: MissionActionResult | null,
  formData: FormData,
): Promise<MissionActionResult> {
  const session = await requireRole("admin", "org_admin", "coordinator", "pilot");
  const tenantId = session.user.tenantId;

  const parsed = missionTransitionSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  const { id, status: newStatus } = parsed.data;

  try {
    await withTenantContext(tenantId, async (tx) => {
      const [current] = await tx
        .select()
        .from(missions)
        .where(and(eq(missions.id, id), eq(missions.tenantId, tenantId)));

      if (!current) throw new Error("Mision no encontrada");

      if (!canTransition(current.status, newStatus)) {
        throw new Error(
          `Transicion no permitida: ${current.status} → ${newStatus}`,
        );
      }

      // Gate: in_flight requiere piloto y drone asignados
      if (newStatus === "in_flight") {
        if (!current.pilotId) throw new Error("Debe asignar un piloto antes de iniciar vuelo");
        if (!current.droneId) throw new Error("Debe asignar un drone antes de iniciar vuelo");
      }

      const values: Record<string, unknown> = {
        status: newStatus,
        updatedAt: new Date(),
      };

      // Track actual times
      if (newStatus === "in_flight") {
        values.actualStart = new Date();
      }
      if (newStatus === "completed" || newStatus === "aborted") {
        values.actualEnd = new Date();
      }

      await tx
        .update(missions)
        .set(values)
        .where(and(eq(missions.id, id), eq(missions.tenantId, tenantId)));

      await AuditService.log(
        {
          tenantId,
          userId: session.user.id,
          action: "transition",
          entityType: "mission",
          entityId: id,
          changes: { status: { old: current.status, new: newStatus } },
        },
        tx,
      );
    });

    revalidatePath("/missions");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error en transicion" };
  }
}
