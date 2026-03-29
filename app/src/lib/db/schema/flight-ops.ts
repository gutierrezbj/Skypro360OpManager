import { pgTable, uuid, timestamp, text, integer, numeric, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { missions } from "./missions";
import { users } from "./users";
import { drones } from "./fleet";

/**
 * Flight-ops module — bitácora de vuelo.
 * Extraido de V2.6 Luis, corregido: import order, FKs, tenant_id, timestamps.
 */

export const flightLogs = pgTable("flight_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  missionId: uuid("mission_id").references(() => missions.id, { onDelete: "set null" }),
  pilotId: uuid("pilot_id").notNull().references(() => users.id),
  uasId: uuid("uas_id").notNull().references(() => drones.id),

  takeoffTime: timestamp("takeoff_time", { withTimezone: true }),
  landingTime: timestamp("landing_time", { withTimezone: true }),
  durationMinutes: integer("duration_minutes"),
  maxAltitude: numeric("max_altitude_m", { precision: 6, scale: 1 }),

  observations: text("observations"),
  signatureData: text("signature_data"), // base64 PNG

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_flight_logs_tenant_mission").on(table.tenantId, table.missionId),
  index("idx_flight_logs_pilot").on(table.pilotId),
]);

export type FlightLog = typeof flightLogs.$inferSelect;
export type NewFlightLog = typeof flightLogs.$inferInsert;
