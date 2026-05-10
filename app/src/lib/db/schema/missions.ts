import { pgTable, uuid, varchar, timestamp, pgEnum, text, numeric, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { pilots, drones } from "./fleet";

/**
 * Missions module — lifecycle completo de misiones drone.
 * State machine: planned → approved → preflight → in_flight → completed | aborted
 */

export const missionStatusEnum = pgEnum("mission_status", [
  "draft",
  "planned",
  "approved",
  "preflight",
  "in_flight",
  "completed",
  "aborted",
  "cancelled",
]);

export const missionPriorityEnum = pgEnum("mission_priority", [
  "low",
  "normal",
  "high",
  "urgent",
]);

export const missions = pgTable("missions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  // Identificacion
  code: varchar("code", { length: 50 }).notNull(), // SKY-2026-001 format
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  // Status & priority
  status: missionStatusEnum("status").notNull().default("draft"),
  priority: missionPriorityEnum("priority").notNull().default("normal"),

  // Asignaciones
  pilotId: uuid("pilot_id").references(() => pilots.id),
  droneId: uuid("drone_id").references(() => drones.id),
  coordinatorId: uuid("coordinator_id"),

  // Ubicacion (GeoJSON via PostGIS - se añade con raw SQL en migration)
  // location geometry(Point, 4326)
  // flight_area geometry(Polygon, 4326)
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),

  // Temporal
  scheduledStart: timestamp("scheduled_start", { withTimezone: true }),
  scheduledEnd: timestamp("scheduled_end", { withTimezone: true }),
  actualStart: timestamp("actual_start", { withTimezone: true }),
  actualEnd: timestamp("actual_end", { withTimezone: true }),

  // AESA / compliance
  soraClass: varchar("sora_class", { length: 20 }), // SAIL I-VI
  earoReference: varchar("earo_reference", { length: 100 }),
  maxAltitude: numeric("max_altitude_m", { precision: 6, scale: 1 }),

  // Metadata
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // Código único por tenant — un SKY-2026-001 por operador. Sin esto, el
  // generador (basado en count) podía colisionar tras un delete.
  uniqueIndex("missions_tenant_code_unique").on(t.tenantId, t.code),
]);

// Checklists genéricos eliminados — reemplazados por form tables específicas
// en compliance.ts (formPlanning, formPreflight, formPostflight, formIncidents)

export type Mission = typeof missions.$inferSelect;
export type NewMission = typeof missions.$inferInsert;
