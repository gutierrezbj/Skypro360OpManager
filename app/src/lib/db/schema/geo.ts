import { pgTable, uuid, varchar, timestamp, text, boolean, jsonb, numeric, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

/**
 * Geo module — zonas operacionales y restricciones AESA/ENAIRE.
 * Extraido de V2.6 Luis, corregido: boundary como text (PostGIS geometry
 * se añade via raw SQL migration con spatial index).
 *
 * NOTA: Las columnas PostGIS geometry se crean en la migration SQL:
 *   ALTER TABLE operational_zones ADD COLUMN boundary geometry(Polygon, 4326);
 *   ALTER TABLE restricted_zones_cache ADD COLUMN boundary geometry(Polygon, 4326);
 *   CREATE INDEX idx_op_zones_boundary ON operational_zones USING GIST(boundary);
 *   CREATE INDEX idx_restricted_boundary ON restricted_zones_cache USING GIST(boundary);
 */

export const operationalZones = pgTable("operational_zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  zoneType: varchar("zone_type", { length: 50 }).notNull().default("operational"), // operational, training, emergency
  // boundary: PostGIS geometry(Polygon, 4326) — added via raw SQL migration
  boundaryGeoJson: text("boundary_geojson"), // GeoJSON fallback for API responses
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_op_zones_tenant").on(table.tenantId),
]);

export const restrictedZonesCache = pgTable("restricted_zones_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  source: varchar("source", { length: 100 }).notNull().default("AESA"), // AESA, ENAIRE, NOTAM
  zoneType: varchar("zone_type", { length: 50 }).notNull(), // no_fly, restricted, CTR, danger, prohibited
  // boundary: PostGIS geometry(Polygon, 4326) — added via raw SQL migration
  boundaryGeoJson: text("boundary_geojson"),
  altitudeMin: numeric("altitude_min_m", { precision: 8, scale: 1 }),
  altitudeMax: numeric("altitude_max_m", { precision: 8, scale: 1 }),
  validFrom: timestamp("valid_from", { withTimezone: true }),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OperationalZone = typeof operationalZones.$inferSelect;
export type NewOperationalZone = typeof operationalZones.$inferInsert;
export type RestrictedZone = typeof restrictedZonesCache.$inferSelect;
export type NewRestrictedZone = typeof restrictedZonesCache.$inferInsert;
