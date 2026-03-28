import { pgTable, uuid, varchar, timestamp, pgEnum, text, integer, numeric, jsonb } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

/**
 * Fleet module — drones y pilotos certificados.
 */

export const droneStatusEnum = pgEnum("drone_status", [
  "active",
  "maintenance",
  "retired",
  "pending_registration",
]);

export const drones = pgTable("drones", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  serialNumber: varchar("serial_number", { length: 100 }).notNull(),
  model: varchar("model", { length: 255 }).notNull(),
  manufacturer: varchar("manufacturer", { length: 255 }).notNull(),
  registrationNumber: varchar("registration_number", { length: 100 }), // AESA registration
  status: droneStatusEnum("status").notNull().default("pending_registration"),
  maxFlightTime: integer("max_flight_time_min"), // minutos
  maxPayload: numeric("max_payload_kg", { precision: 6, scale: 2 }),
  category: varchar("category", { length: 50 }), // open, specific, certified
  easaClass: varchar("easa_class", { length: 10 }), // C0-C6
  mtomKg: numeric("mtom_kg", { precision: 6, scale: 2 }), // Max Takeoff Mass
  insuranceExpiry: timestamp("insurance_expiry", { withTimezone: true }),
  specs: jsonb("specs").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pilotCertStatusEnum = pgEnum("pilot_cert_status", [
  "valid",
  "expired",
  "suspended",
  "pending",
]);

export const pilots = pgTable("pilots", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  licenseNumber: varchar("license_number", { length: 100 }),
  certificationStatus: pilotCertStatusEnum("certification_status").notNull().default("pending"),
  certificationExpiry: timestamp("certification_expiry", { withTimezone: true }),
  medicalExpiry: timestamp("medical_expiry", { withTimezone: true }),
  flightHours: numeric("flight_hours", { precision: 8, scale: 1 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Drone = typeof drones.$inferSelect;
export type NewDrone = typeof drones.$inferInsert;
export type Pilot = typeof pilots.$inferSelect;
export type NewPilot = typeof pilots.$inferInsert;
