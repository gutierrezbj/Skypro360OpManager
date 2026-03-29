"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, withTenantContext } from "@/lib/db";
import {
  formPlanning,
  formPreflight,
  formPostflight,
  formIncidents,
} from "@/lib/db/schema";
import { requireRole } from "@/server/middleware/auth";
import { AuditService } from "@/modules/audit/service";
import {
  planningFormSchema,
  preflightFormSchema,
  postflightFormSchema,
  incidentFormSchema,
} from "../schemas/compliance.schema";

export type ComplianceActionResult = {
  success: boolean;
  error?: string;
};

// --- Planning Form (Apéndice A.4) ---

export async function savePlanningForm(
  _prev: ComplianceActionResult | null,
  formData: FormData,
): Promise<ComplianceActionResult> {
  const session = await requireRole("admin", "org_admin", "coordinator");
  const tenantId = session.user.tenantId;

  const raw = Object.fromEntries(formData.entries());
  // Parse checklist items from jsonData hidden field
  if (typeof raw.jsonData === "string" && raw.jsonData) {
    try { raw.jsonData = JSON.parse(raw.jsonData as string); } catch { /* keep as string */ }
  }
  const parsed = planningFormSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  const input = parsed.data;

  try {
    await withTenantContext(tenantId, async (tx) => {
      // Upsert — one planning form per mission
      const [existing] = await tx
        .select({ id: formPlanning.id })
        .from(formPlanning)
        .where(and(eq(formPlanning.missionId, input.missionId), eq(formPlanning.tenantId, tenantId)));

      if (existing) {
        await tx
          .update(formPlanning)
          .set({
            riskLevel: input.riskLevel,
            weatherForecast: input.weatherForecast,
            operationType: input.operationType,
            maxAltitude: input.maxAltitude,
            jsonData: input.jsonData as Record<string, unknown>,
            signatureData: input.signatureData,
            rpApproved: input.rpApproved,
            rpSignature: input.rpSignature,
            updatedAt: new Date(),
          })
          .where(eq(formPlanning.id, existing.id));

        await AuditService.log({
          tenantId,
          userId: session.user.id,
          action: "update",
          entityType: "form_planning",
          entityId: existing.id,
          metadata: { missionId: input.missionId },
        }, tx);
      } else {
        const [record] = await tx
          .insert(formPlanning)
          .values({
            tenantId,
            missionId: input.missionId,
            userId: session.user.id,
            riskLevel: input.riskLevel,
            weatherForecast: input.weatherForecast,
            operationType: input.operationType,
            maxAltitude: input.maxAltitude,
            jsonData: input.jsonData as Record<string, unknown>,
            signatureData: input.signatureData,
            rpApproved: input.rpApproved,
            rpSignature: input.rpSignature,
          })
          .returning();

        await AuditService.log({
          tenantId,
          userId: session.user.id,
          action: "create",
          entityType: "form_planning",
          entityId: record.id,
          metadata: { missionId: input.missionId },
        }, tx);
      }
    });

    revalidatePath(`/missions`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error al guardar planificacion" };
  }
}

// --- Preflight Form (Apéndice A.5/A.6) ---

export async function savePreflightForm(
  _prev: ComplianceActionResult | null,
  formData: FormData,
): Promise<ComplianceActionResult> {
  const session = await requireRole("admin", "org_admin", "coordinator", "pilot");
  const tenantId = session.user.tenantId;

  const raw = Object.fromEntries(formData.entries());
  if (typeof raw.jsonData === "string" && raw.jsonData) {
    try { raw.jsonData = JSON.parse(raw.jsonData as string); } catch { /* keep */ }
  }
  const parsed = preflightFormSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  const input = parsed.data;

  try {
    await withTenantContext(tenantId, async (tx) => {
      const weatherConditions = {
        windSpeed: input.windSpeed,
        temperature: input.temperature,
        precipitation: input.precipitation,
        visibility: input.visibility,
      };

      const [record] = await tx
        .insert(formPreflight)
        .values({
          tenantId,
          missionId: input.missionId,
          userId: session.user.id,
          uasId: input.uasId,
          weatherConditions,
          airspaceStatus: input.airspaceStatus,
          jsonData: input.jsonData as Record<string, unknown>,
          signatureData: input.signatureData,
        })
        .returning();

      await AuditService.log({
        tenantId,
        userId: session.user.id,
        action: "create",
        entityType: "form_preflight",
        entityId: record.id,
        metadata: { missionId: input.missionId },
      }, tx);
    });

    revalidatePath(`/missions`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error al guardar preflight" };
  }
}

// --- Postflight Form (Apéndice A.7/A.8) ---

export async function savePostflightForm(
  _prev: ComplianceActionResult | null,
  formData: FormData,
): Promise<ComplianceActionResult> {
  const session = await requireRole("admin", "org_admin", "coordinator", "pilot");
  const tenantId = session.user.tenantId;

  const raw = Object.fromEntries(formData.entries());
  if (typeof raw.jsonData === "string" && raw.jsonData) {
    try { raw.jsonData = JSON.parse(raw.jsonData as string); } catch { /* keep */ }
  }
  const parsed = postflightFormSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  const input = parsed.data;

  try {
    await withTenantContext(tenantId, async (tx) => {
      const [record] = await tx
        .insert(formPostflight)
        .values({
          tenantId,
          missionId: input.missionId,
          userId: session.user.id,
          uasId: input.uasId,
          batteryRemaining: input.batteryRemaining,
          jsonData: input.jsonData as Record<string, unknown>,
          signatureData: input.signatureData,
        })
        .returning();

      await AuditService.log({
        tenantId,
        userId: session.user.id,
        action: "create",
        entityType: "form_postflight",
        entityId: record.id,
        metadata: { missionId: input.missionId },
      }, tx);
    });

    revalidatePath(`/missions`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error al guardar postflight" };
  }
}

// --- Incident Form (Anexo I) ---

export async function saveIncidentForm(
  _prev: ComplianceActionResult | null,
  formData: FormData,
): Promise<ComplianceActionResult> {
  const session = await requireRole("admin", "org_admin", "coordinator", "pilot");
  const tenantId = session.user.tenantId;

  const raw = Object.fromEntries(formData.entries());
  if (typeof raw.jsonData === "string" && raw.jsonData) {
    try { raw.jsonData = JSON.parse(raw.jsonData as string); } catch { /* keep */ }
  }
  const parsed = incidentFormSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  const input = parsed.data;

  try {
    await withTenantContext(tenantId, async (tx) => {
      const [record] = await tx
        .insert(formIncidents)
        .values({
          tenantId,
          missionId: input.missionId,
          userId: session.user.id,
          incidentType: input.incidentType,
          description: input.description,
          actionsTaken: input.actionsTaken,
          aesaNotified: input.aesaNotified,
          jsonData: input.jsonData as Record<string, unknown>,
          signatureData: input.signatureData,
        })
        .returning();

      await AuditService.log({
        tenantId,
        userId: session.user.id,
        action: "create",
        entityType: "form_incident",
        entityId: record.id,
        metadata: { missionId: input.missionId, incidentType: input.incidentType },
      }, tx);
    });

    revalidatePath(`/missions`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error al guardar incidente" };
  }
}
