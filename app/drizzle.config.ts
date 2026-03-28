import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL
      ?? "postgresql://opsmanager:opsmanager@localhost:6100/opsmanager",
  },
  verbose: true,
  strict: true,
});
