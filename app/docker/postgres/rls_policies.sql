-- =============================================================
-- OpsManager RLS Policies — Multi-tenant isolation
-- Corregido de V2.6: cubre TODAS las tablas con tenant_id,
-- incluye WITH CHECK para writes, FORCE RLS para owners.
-- =============================================================

-- Helper: current tenant from session context
-- Set via: SELECT set_config('app.current_tenant_id', '<uuid>', true)

-- =============================================================
-- 1. TENANTS — solo admin ve/modifica su propio tenant
-- =============================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_select ON tenants
  FOR SELECT USING (id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_isolation_insert ON tenants
  FOR INSERT WITH CHECK (id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_isolation_update ON tenants
  FOR UPDATE USING (id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (id = current_setting('app.current_tenant_id', true)::uuid);

-- =============================================================
-- 2. USERS
-- =============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

CREATE POLICY users_isolation_select ON users
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY users_isolation_insert ON users
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY users_isolation_update ON users
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY users_isolation_delete ON users
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- =============================================================
-- 3. DRONES
-- =============================================================
ALTER TABLE drones ENABLE ROW LEVEL SECURITY;
ALTER TABLE drones FORCE ROW LEVEL SECURITY;

CREATE POLICY drones_isolation_select ON drones
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY drones_isolation_insert ON drones
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY drones_isolation_update ON drones
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY drones_isolation_delete ON drones
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- =============================================================
-- 4. PILOTS
-- =============================================================
ALTER TABLE pilots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilots FORCE ROW LEVEL SECURITY;

CREATE POLICY pilots_isolation_select ON pilots
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY pilots_isolation_insert ON pilots
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY pilots_isolation_update ON pilots
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY pilots_isolation_delete ON pilots
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- =============================================================
-- 5. MISSIONS
-- =============================================================
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions FORCE ROW LEVEL SECURITY;

CREATE POLICY missions_isolation_select ON missions
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY missions_isolation_insert ON missions
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY missions_isolation_update ON missions
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY missions_isolation_delete ON missions
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- =============================================================
-- 6. AUDIT LOGS (solo select — inmutables)
-- =============================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY audit_isolation_select ON audit_logs
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY audit_isolation_insert ON audit_logs
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
-- No UPDATE/DELETE — audit logs son inmutables

-- =============================================================
-- 7. FLIGHT LOGS
-- =============================================================
ALTER TABLE flight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY flight_logs_isolation_select ON flight_logs
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY flight_logs_isolation_insert ON flight_logs
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY flight_logs_isolation_update ON flight_logs
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- =============================================================
-- 8. COMPLIANCE TEMPLATES
-- =============================================================
ALTER TABLE compliance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_templates FORCE ROW LEVEL SECURITY;

CREATE POLICY compliance_tpl_isolation_select ON compliance_templates
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY compliance_tpl_isolation_insert ON compliance_templates
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY compliance_tpl_isolation_update ON compliance_templates
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- =============================================================
-- 9. FORM PLANNING (A.4)
-- =============================================================
ALTER TABLE form_planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_planning FORCE ROW LEVEL SECURITY;

CREATE POLICY form_planning_isolation_select ON form_planning
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY form_planning_isolation_insert ON form_planning
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY form_planning_isolation_update ON form_planning
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- =============================================================
-- 10. FORM PREFLIGHT (A.5/A.6)
-- =============================================================
ALTER TABLE form_preflight ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_preflight FORCE ROW LEVEL SECURITY;

CREATE POLICY form_preflight_isolation_select ON form_preflight
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY form_preflight_isolation_insert ON form_preflight
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY form_preflight_isolation_update ON form_preflight
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- =============================================================
-- 11. FORM POSTFLIGHT (A.7/A.8)
-- =============================================================
ALTER TABLE form_postflight ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_postflight FORCE ROW LEVEL SECURITY;

CREATE POLICY form_postflight_isolation_select ON form_postflight
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY form_postflight_isolation_insert ON form_postflight
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY form_postflight_isolation_update ON form_postflight
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- =============================================================
-- 12. FORM INCIDENTS (Anexo I)
-- =============================================================
ALTER TABLE form_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_incidents FORCE ROW LEVEL SECURITY;

CREATE POLICY form_incidents_isolation_select ON form_incidents
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY form_incidents_isolation_insert ON form_incidents
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY form_incidents_isolation_update ON form_incidents
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- =============================================================
-- 13. OPERATIONAL ZONES
-- =============================================================
ALTER TABLE operational_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_zones FORCE ROW LEVEL SECURITY;

CREATE POLICY op_zones_isolation_select ON operational_zones
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY op_zones_isolation_insert ON operational_zones
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY op_zones_isolation_update ON operational_zones
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY op_zones_isolation_delete ON operational_zones
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- =============================================================
-- 14. RESTRICTED ZONES CACHE (global — sin tenant, acceso libre lectura)
-- =============================================================
ALTER TABLE restricted_zones_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE restricted_zones_cache FORCE ROW LEVEL SECURITY;

CREATE POLICY restricted_zones_read_all ON restricted_zones_cache
  FOR SELECT USING (true);
-- INSERT/UPDATE solo via admin (seed, import AESA/ENAIRE)
CREATE POLICY restricted_zones_admin_write ON restricted_zones_cache
  FOR INSERT WITH CHECK (current_setting('app.current_tenant_id', true) IS NOT NULL);
