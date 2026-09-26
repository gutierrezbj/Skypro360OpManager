"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { withTenantContext } from "@/lib/db";
import { missionCoordinations } from "@/lib/db/schema";
import { requireRole } from "@/server/middleware/auth";
import { ActionError, toActionError } from "@/server/actions/errors";
import { getMissionById } from "@/lib/db/queries/missions.queries";
import { AuditService } from "@/modules/audit/service";
import {
  coordinationAddSchema,
  coordinationUpdateSchema,
  coordinationRemoveSchema,
} from "../schemas/coordination.schema";
import { BODY_DEFAULT_DAYS, BODY_LABELS, diasHabilesPermitidos, DEFENSA_RANGE } from "../logic";

export type CoordinationActionResult = {
  success: boolean;
  error?: string;
};

const MANAGE_ROLES = ["admin", "org_admin", "coordinator"] as const;

function revalidate(missionId: string) {
  revalidatePath(`/missions/${missionId}/compliance`);
  revalidatePath("/missions");
  revalidatePath("/");
}

export async function addCoordination(
  _prev: CoordinationActionResult | null,
  formData: FormData,
): Promise<CoordinationActionResult> {
  const session = await requireRole(...MANAGE_ROLES);
  const tenantId = session.user.tenantId;

  const parsed = coordinationAddSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const input = parsed.data;
  const diasHabiles = input.diasHabiles ?? BODY_DEFAULT_DAYS[input.organismo];

  if (!diasHabilesPermitidos(input.organismo, diasHabiles)) {
    return {
      success: false,
      error: input.organismo === "defensa"
        ? `Defensa admite entre ${DEFENSA_RANGE.min} y ${DEFENSA_RANGE.max} días hábiles`
        : `${BODY_LABELS[input.organismo]} tiene un plazo fijo de ${BODY_DEFAULT_DAYS[input.organismo]} días hábiles`,
    };
  }

  try {
    await withTenantContext(tenantId, async (tx) => {
      const mission = await getMissionById(input.missionId, tenantId, tx);
      if (!mission) throw new ActionError("Misión no encontrada");

      const [existing] = await tx
        .select({ id: missionCoordinations.id })
        .from(missionCoordinations)
        .where(and(
          eq(missionCoordinations.missionId, input.missionId),
          eq(missionCoordinations.organismo, input.organismo),
        ))
        .limit(1);
      if (existing) throw new ActionError(`${BODY_LABELS[input.organismo]} ya está añadido a esta misión`);

      const [record] = await tx
        .insert(missionCoordinations)
        .values({ tenantId, missionId: input.missionId, organismo: input.organismo, diasHabiles })
        .returning();

      await AuditService.log({
        tenantId,
        userId: session.user.id,
        action: "create",
        entityType: "mission_coordination",
        entityId: record.id,
        metadata: { missionId: input.missionId, organismo: input.organismo, diasHabiles },
      }, tx);
    });

    revalidate(input.missionId);
    return { success: true };
  } catch (err) {
    return toActionError(err, "No se pudo añadir la coordinación");
  }
}

export async function updateCoordination(
  _prev: CoordinationActionResult | null,
  formData: FormData,
): Promise<CoordinationActionResult> {
  const session = await requireRole(...MANAGE_ROLES);
  const tenantId = session.user.tenantId;

  const parsed = coordinationUpdateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { id, ...updates } = parsed.data;

  let missionId = "";
  try {
    await withTenantContext(tenantId, async (tx) => {
      const [current] = await tx
        .select()
        .from(missionCoordinations)
        .where(and(eq(missionCoordinations.id, id), eq(missionCoordinations.tenantId, tenantId)))
        .limit(1);
      if (!current) throw new ActionError("Coordinación no encontrada");
      missionId = current.missionId;

      const values: Partial<typeof current> & { updatedAt: Date } = { updatedAt: new Date() };
      const changes: Record<string, { old: unknown; new: unknown }> = {};

      if (updates.estado !== undefined && updates.estado !== current.estado) {
        values.estado = updates.estado;
        changes.estado = { old: current.estado, new: updates.estado };
      }
      if (updates.contacto !== undefined) {
        const next = updates.contacto === "" ? null : updates.contacto;
        if (next !== current.contacto) {
          values.contacto = next;
          changes.contacto = { old: current.contacto, new: next };
        }
      }
      if (updates.diasHabiles !== undefined && updates.diasHabiles !== current.diasHabiles) {
        if (!diasHabilesPermitidos(current.organismo, updates.diasHabiles)) {
          throw new ActionError(
            current.organismo === "defensa"
              ? `Defensa admite entre ${DEFENSA_RANGE.min} y ${DEFENSA_RANGE.max} días hábiles`
              : `${BODY_LABELS[current.organismo]} tiene un plazo fijo`,
          );
        }
        values.diasHabiles = updates.diasHabiles;
        changes.diasHabiles = { old: current.diasHabiles, new: updates.diasHabiles };
      }

      if (Object.keys(changes).length === 0) return;

      await tx
        .update(missionCoordinations)
        .set(values)
        .where(eq(missionCoordinations.id, id));

      await AuditService.log({
        tenantId,
        userId: session.user.id,
        action: changes.estado ? "status_change" : "update",
        entityType: "mission_coordination",
        entityId: id,
        changes,
        metadata: { missionId: current.missionId, organismo: current.organismo },
      }, tx);
    });

    if (missionId) revalidate(missionId);
    return { success: true };
  } catch (err) {
    return toActionError(err, "No se pudo actualizar la coordinación");
  }
}

export async function removeCoordination(
  _prev: CoordinationActionResult | null,
  formData: FormData,
): Promise<CoordinationActionResult> {
  const session = await requireRole(...MANAGE_ROLES);
  const tenantId = session.user.tenantId;

  const parsed = coordinationRemoveSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: "Datos inválidos" };
  }
  const { id } = parsed.data;

  let missionId = "";
  try {
    await withTenantContext(tenantId, async (tx) => {
      const [current] = await tx
        .select()
        .from(missionCoordinations)
        .where(and(eq(missionCoordinations.id, id), eq(missionCoordinations.tenantId, tenantId)))
        .limit(1);
      if (!current) throw new ActionError("Coordinación no encontrada");
      missionId = current.missionId;

      await AuditService.log({
        tenantId,
        userId: session.user.id,
        action: "delete",
        entityType: "mission_coordination",
        entityId: id,
        metadata: { missionId: current.missionId, organismo: current.organismo, estado: current.estado },
      }, tx);

      await tx.delete(missionCoordinations).where(eq(missionCoordinations.id, id));
    });

    if (missionId) revalidate(missionId);
    return { success: true };
  } catch (err) {
    return toActionError(err, "No se pudo eliminar la coordinación");
  }
}
