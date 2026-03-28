import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, type NewAuditLog } from "@/lib/db/schema/audit";

/**
 * AuditService — trazabilidad forense para inspecciones AESA.
 *
 * Regla AESA: los logs son inmutables y NUNCA deben fallar silenciosamente.
 * Si log() falla, lanza excepción (que aborta la transacción padre).
 *
 * Acepta `dbOverride` para participar en transacciones externas (tx passthrough).
 */

type AuditInput = {
  tenantId: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
};

export const AuditService = {
  /**
   * Registra un evento de auditoría. Lanza en caso de error (requisito AESA).
   * Pasar `txDb` cuando se llama dentro de una transacción withTenantContext.
   */
  async log(input: AuditInput, txDb: typeof db = db): Promise<void> {
    const record: NewAuditLog = {
      tenantId: input.tenantId,
      userId: input.userId,
      sessionId: input.sessionId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      changes: input.changes,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    };

    const result = await txDb.insert(auditLogs).values(record).returning({ id: auditLogs.id });

    if (!result.length) {
      throw new Error(
        `AUDIT FAILURE: could not log ${input.action} on ${input.entityType}:${input.entityId}. ` +
        `AESA compliance requires all mutations to be audited.`
      );
    }
  },

  /**
   * Historial de auditoría de una entidad específica.
   */
  async getEntityHistory(tenantId: string, entityType: string, entityId: string) {
    return db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.tenantId, tenantId),
          eq(auditLogs.entityType, entityType),
          eq(auditLogs.entityId, entityId),
        )
      )
      .orderBy(desc(auditLogs.createdAt));
  },

  /**
   * Log de actividad reciente de un tenant (para dashboard admin).
   */
  async getRecentActivity(tenantId: string, limit = 50) {
    return db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.tenantId, tenantId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  },
};
