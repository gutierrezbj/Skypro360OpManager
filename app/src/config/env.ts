import { z } from "zod";

/**
 * Validacion de variables de entorno con Zod.
 * Falla al arrancar si falta algo critico.
 */

const serverSchema = z.object({
  // App
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3100),

  // Database (PostgreSQL + PostGIS)
  DATABASE_URL: z.string().url().default("postgresql://opsmanager:opsmanager@localhost:6100/opsmanager"),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6101/0"),

  // Auth
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().default("http://localhost:3100"),

  // Optional: SMTP for notifications
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3100"),
  NEXT_PUBLIC_MAPLIBRE_STYLE: z.string().default("https://demotiles.maplibre.org/style.json"),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

// Parse server env — falla si variables criticas no estan
function validateServerEnv(): ServerEnv {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid server environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid server environment variables");
  }
  return parsed.data;
}

function validateClientEnv(): ClientEnv {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_MAPLIBRE_STYLE: process.env.NEXT_PUBLIC_MAPLIBRE_STYLE,
  });
  if (!parsed.success) {
    console.error("Invalid client environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid client environment variables");
  }
  return parsed.data;
}

export const serverEnv = validateServerEnv();
export const clientEnv = validateClientEnv();
