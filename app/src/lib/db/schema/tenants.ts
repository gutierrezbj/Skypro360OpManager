import { pgTable, uuid, varchar, timestamp, boolean } from "drizzle-orm/pg-core";

/**
 * Tabla de tenants — base del multi-tenant.
 * Todas las tablas de negocio referencian tenant_id.
 */
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  // ── Datos del operador AESA (opcionales, se usan en dossier PDF y cabeceras compliance)
  legalName:                 varchar("legal_name",                 { length: 255 }),
  nif:                       varchar("nif",                        { length: 32 }),
  operatorRegistrationNumber: varchar("operator_registration_number", { length: 64 }),
  aesaCsv:                   varchar("aesa_csv",                   { length: 128 }),
  contactEmail:              varchar("contact_email",              { length: 255 }),
  contactPhone:              varchar("contact_phone",              { length: 32 }),
  address:                   varchar("address",                    { length: 500 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
