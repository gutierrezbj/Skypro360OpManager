-- Coordinaciones aeronáuticas por misión (MI, helipuerto, aeropuerto, Defensa)

DO $$ BEGIN
  CREATE TYPE "coordination_body" AS ENUM ('mi', 'helipuerto', 'aeropuerto', 'defensa');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "coordination_status" AS ENUM ('pendiente', 'enviada', 'aprobada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "mission_coordinations" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"    uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "mission_id"   uuid NOT NULL REFERENCES "missions"("id") ON DELETE CASCADE,
  "organismo"    "coordination_body" NOT NULL,
  "dias_habiles" integer NOT NULL,
  "estado"       "coordination_status" NOT NULL DEFAULT 'pendiente',
  "contacto"     varchar(255),
  "created_at"   timestamptz NOT NULL DEFAULT now(),
  "updated_at"   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "mission_coordinations_mission_body_unique"
  ON "mission_coordinations" ("mission_id", "organismo");
CREATE INDEX IF NOT EXISTS "mission_coordinations_tenant_idx"
  ON "mission_coordinations" ("tenant_id");

CREATE TABLE IF NOT EXISTS "coordination_reminders" (
  "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"       uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "coordination_id" uuid NOT NULL REFERENCES "mission_coordinations"("id") ON DELETE CASCADE,
  "dias"            integer NOT NULL,
  "sent_at"         timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "coordination_reminders_unique"
  ON "coordination_reminders" ("coordination_id", "dias");

-- RLS (mismo patrón que el resto de tablas con tenant_id)
ALTER TABLE "mission_coordinations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mission_coordinations" FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY mission_coordinations_isolation_select ON mission_coordinations
    FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
  CREATE POLICY mission_coordinations_isolation_insert ON mission_coordinations
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
  CREATE POLICY mission_coordinations_isolation_update ON mission_coordinations
    FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
  CREATE POLICY mission_coordinations_isolation_delete ON mission_coordinations
    FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "coordination_reminders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "coordination_reminders" FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY coordination_reminders_isolation_select ON coordination_reminders
    FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
  CREATE POLICY coordination_reminders_isolation_insert ON coordination_reminders
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
