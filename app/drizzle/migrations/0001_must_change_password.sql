-- Sprint 1.3 — cambio de password obligatorio en primer login
-- Añade columna must_change_password a users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "must_change_password" boolean NOT NULL DEFAULT false;
