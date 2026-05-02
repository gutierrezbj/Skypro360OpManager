-- Datos AESA del operador en tenant
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "legal_name"                  varchar(255);
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "nif"                         varchar(32);
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "operator_registration_number" varchar(64);
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "aesa_csv"                    varchar(128);
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "contact_email"               varchar(255);
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "contact_phone"               varchar(32);
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "address"                     varchar(500);
