import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3100),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().min(1),

  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  SMTP_FROM: z.string().optional(),
  SMTP_AUTH_USER: z.string().optional(),
  SMTP_APP_PASSWORD: z.string().optional(),

  AEMET_API_KEY: z.string().optional(),
  TELEMETRY_API_KEY: z.string().optional(),
  CRON_SECRET: z.string().min(16).optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3100"),
  NEXT_PUBLIC_MAPLIBRE_STYLE: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

export function validateEnv(): { server: ServerEnv; client: ClientEnv } {
  const server = serverSchema.safeParse(process.env);
  const client = clientSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_MAPLIBRE_STYLE: process.env.NEXT_PUBLIC_MAPLIBRE_STYLE,
  });

  if (!server.success || !client.success) {
    const errors = {
      ...(server.success ? {} : server.error.flatten().fieldErrors),
      ...(client.success ? {} : client.error.flatten().fieldErrors),
    };
    console.error("[env] Variables de entorno inválidas:", errors);
    throw new Error("Invalid environment variables");
  }

  return { server: server.data, client: client.data };
}
