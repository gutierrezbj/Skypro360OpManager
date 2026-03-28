import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * PostgreSQL connection via postgres.js + Drizzle ORM.
 * Single connection pool reused across requests (Next.js hot reload safe).
 */

const globalForDb = globalThis as typeof globalThis & {
  pgClient: ReturnType<typeof postgres> | undefined;
};

const connectionString = process.env.DATABASE_URL
  ?? "postgresql://opsmanager:opsmanager@localhost:6100/opsmanager";

const pgClient = globalForDb.pgClient ?? postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = pgClient;
}

export const db = drizzle(pgClient, { schema });
export { pgClient };

/**
 * Ejecuta un callback con tenant context en PostgreSQL para RLS.
 * Wrappea en transaccion para que set_config(..., true) quede scoped
 * y no se filtre a otras conexiones del pool.
 *
 * Uso:
 *   const result = await withTenantContext(tenantId, async (tx) => {
 *     return tx.select().from(missions).where(...);
 *   });
 */
export async function withTenantContext<T>(
  tenantId: string,
  callback: (tx: typeof db) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`);
    return callback(tx as unknown as typeof db);
  }) as Promise<T>;
}
