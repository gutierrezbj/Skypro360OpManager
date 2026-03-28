/**
 * Schema barrel — re-exports all module schemas.
 * Drizzle usa esto para type inference y migrations.
 */
export * from "./tenants";
export * from "./users";
export * from "./fleet";
export * from "./missions";
export * from "./audit";
export * from "./compliance";
export * from "./flight-ops";
export * from "./geo";
