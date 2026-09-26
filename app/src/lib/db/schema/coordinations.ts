import { pgTable, uuid, integer, varchar, timestamp, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { missions } from "./missions";

/**
 * Coordinaciones aeronáuticas — organismos con los que hay que coordinar
 * antes de volar (Ministerio del Interior, helipuerto, aeropuerto, Defensa),
 * cada uno con su antelación en días hábiles y su estado.
 *
 * El límite NO se guarda: se calcula desde missions.scheduled_start y
 * dias_habiles (ver modules/coordinations/logic.ts), así se recalcula solo
 * si cambia la fecha de vuelo.
 */

export const coordinationBodyEnum = pgEnum("coordination_body", [
  "mi",
  "helipuerto",
  "aeropuerto",
  "defensa",
]);

export const coordinationStatusEnum = pgEnum("coordination_status", [
  "pendiente",
  "enviada",
  "aprobada",
]);

export const missionCoordinations = pgTable("mission_coordinations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  missionId: uuid("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  organismo: coordinationBodyEnum("organismo").notNull(),
  diasHabiles: integer("dias_habiles").notNull(),
  estado: coordinationStatusEnum("estado").notNull().default("pendiente"),
  contacto: varchar("contacto", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("mission_coordinations_mission_body_unique").on(t.missionId, t.organismo),
]);

export const coordinationReminders = pgTable("coordination_reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  coordinationId: uuid("coordination_id").notNull().references(() => missionCoordinations.id, { onDelete: "cascade" }),
  dias: integer("dias").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("coordination_reminders_unique").on(t.coordinationId, t.dias),
]);

export type MissionCoordination = typeof missionCoordinations.$inferSelect;
export type NewMissionCoordination = typeof missionCoordinations.$inferInsert;
export type CoordinationReminder = typeof coordinationReminders.$inferSelect;
