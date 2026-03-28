import { pgTable, uuid, varchar, timestamp, text, jsonb, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

/**
 * Audit module — trazabilidad forense para inspecciones AESA.
 * Cada cambio en BD queda registrado. Los logs son inmutables (no updatedAt).
 */

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  sessionId: varchar("session_id", { length: 255 }),

  action: varchar("action", { length: 50 }).notNull(), // create, update, delete, status_change, sign, login, etc.
  entityType: varchar("entity_type", { length: 50 }).notNull(), // mission, drone, pilot, form_planning, etc.
  entityId: uuid("entity_id").notNull(),

  changes: jsonb("changes").$type<Record<string, { old: unknown; new: unknown }>>(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),

  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 + IPv6
  userAgent: text("user_agent"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_audit_tenant_entity").on(table.tenantId, table.entityType, table.entityId),
  index("idx_audit_tenant_created").on(table.tenantId, table.createdAt),
]);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
