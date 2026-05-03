import { pgTable, uuid, varchar, timestamp, text, jsonb, boolean, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { missions } from "./missions";
import { users } from "./users";

/**
 * Compliance module — formularios AESA para Manual de Operaciones.
 * Extraido de V2.6 Luis, corregido: tenant_id en todas las tablas,
 * timestamps con tz, type exports, unique constraints.
 */

// --- Compliance Templates (checklists dinámicos por operadora) ---

export const complianceTemplates = pgTable("compliance_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // preflight, postflight, risk_assessment, conditions
  name: varchar("name", { length: 255 }).notNull(),
  version: varchar("version", { length: 20 }).notNull().default("1.0"),
  items: jsonb("items").$type<ComplianceTemplateItem[]>().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export interface ComplianceTemplateItem {
  key: string;
  label: string;
  required: boolean;
  category?: string;
}

// --- Form Planning (Apéndice A.4 — Planificación Operacional SORA) ---

export const formPlanning = pgTable("form_planning", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  missionId: uuid("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),

  riskLevel: varchar("risk_level", { length: 50 }),
  weatherForecast: text("weather_forecast"),
  operationType: varchar("operation_type", { length: 50 }), // VLOS, BVLOS, etc.
  maxAltitude: varchar("max_altitude", { length: 50 }),
  jsonData: jsonb("json_data").$type<Record<string, unknown>>(),
  signatureData: text("signature_data"), // base64 PNG

  // Firma del Responsable de Operaciones (requisito SORA)
  rpApproved: boolean("rp_approved").default(false),
  rpSignature: text("rp_signature"), // base64 PNG

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("idx_form_planning_mission").on(table.missionId),
]);

// --- Form Preflight (Apéndice A.5/A.6 — Checklist Pre-Vuelo) ---

export const formPreflight = pgTable("form_preflight", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  missionId: uuid("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),

  uasId: varchar("uas_id", { length: 100 }),
  weatherConditions: jsonb("weather_conditions").$type<WeatherConditions>(),
  airspaceStatus: varchar("airspace_status", { length: 100 }),
  jsonData: jsonb("json_data").$type<Record<string, unknown>>(),
  signatureData: text("signature_data"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export interface WeatherConditions {
  windSpeed?: number;
  temperature?: number;
  precipitation?: string;
  visibility?: string;
}

// --- Form Postflight (Apéndice A.7/A.8 — Checklist Post-Vuelo) ---

export const formPostflight = pgTable("form_postflight", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  missionId: uuid("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),

  uasId: varchar("uas_id", { length: 100 }),
  batteryRemaining: varchar("battery_remaining", { length: 10 }),
  jsonData: jsonb("json_data").$type<Record<string, unknown>>(),
  signatureData: text("signature_data"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Form Incidents (Anexo I — Informe Incidente/Accidente) ---

export const incidentTypeEnum = pgEnum("incident_type", [
  "none",                  // Declaracion formal "sin incidentes"
  "flyaway",
  "collision",
  "injury",
  "property_damage",
  "airspace_violation",
  "equipment_failure",
  "communication_loss",
  "battery_emergency",
  "weather_event",
  "other",
]);

export const formIncidents = pgTable("form_incidents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  missionId: uuid("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),

  incidentType: incidentTypeEnum("incident_type").notNull(),
  description: text("description").notNull(),
  actionsTaken: text("actions_taken"),
  aesaNotified: boolean("aesa_notified").default(false),
  jsonData: jsonb("json_data").$type<Record<string, unknown>>(),
  signatureData: text("signature_data"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Type exports
export type ComplianceTemplate = typeof complianceTemplates.$inferSelect;
export type NewComplianceTemplate = typeof complianceTemplates.$inferInsert;
export type FormPlanning = typeof formPlanning.$inferSelect;
export type NewFormPlanning = typeof formPlanning.$inferInsert;
export type FormPreflight = typeof formPreflight.$inferSelect;
export type NewFormPreflight = typeof formPreflight.$inferInsert;
export type FormPostflight = typeof formPostflight.$inferSelect;
export type NewFormPostflight = typeof formPostflight.$inferInsert;
export type FormIncident = typeof formIncidents.$inferSelect;
export type NewFormIncident = typeof formIncidents.$inferInsert;
