-- Código de misión único por tenant (ya aplicado en prod a mano el 2026-05-10)
CREATE UNIQUE INDEX IF NOT EXISTS "missions_tenant_code_unique" ON "missions" ("tenant_id", "code");
