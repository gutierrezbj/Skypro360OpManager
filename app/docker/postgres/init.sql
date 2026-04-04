-- OpsManager — PostgreSQL init script
-- Runs on first container start only (when pgdata volume is empty)

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- RLS helper: set current tenant_id per session
-- Usage: SET app.current_tenant_id = '<uuid>';
-- Then RLS policies use current_setting('app.current_tenant_id')

-- Sessions table: no tenant_id (global), solo acceso autenticado
-- RLS no aplica aqui — protegido por logica de aplicacion (Auth.js)

-- Log
SELECT 'OpsManager DB initialized with PostGIS ' || PostGIS_Version() AS status;
