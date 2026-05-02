# OpsManager — Skypro360

Plataforma de gestion de operaciones drone para Skypro360. Multi-tenant SaaS ready.

## Estado actual

**Fase 4 — COMPLETADA** | Sprints 1+2+3 cierre v1.0 (2026-05-02)

Fases 0-3 cerradas (paperwork, SDDs, infra reservada). Scaffold limpio en `app/`.
Luis entrego V2.6 "Certified Final" con compliance AESA funcional. Estrategia: Opcion A — nuestro scaffold como base, extraer lo valioso de V2.6.

### Progreso Fase 4

| Sub-fase | Estado | Fecha | Entregables |
|----------|--------|-------|-------------|
| 4A — Foundation | COMPLETADA | 2026-03-28 | Fleet CRUD (drones+pilotos), Zod validation, server actions, audit log, seed 5 drones + 2 pilotos reales |
| 4B — Core Product | COMPLETADA | 2026-03-28 | Missions CRUD, state machine 8 estados, transiciones validadas, gates (piloto+drone requeridos para in_flight), auto-codigo SKY-YYYY-XXX, seed 12 misiones |
| 4C — Visualization | COMPLETADA | 2026-03-31 | MapLibre GL JS, card-style markers (mini-cards SKY-XXX + color dot), popup info basica al click, panel detalle completo, boton centrar mapa, dashboard stats bar, leyenda |
| 4D — Compliance | COMPLETADA | 2026-03-29 | AESA forms A.4-A.8+Anexo I con firma digital, SignaturePad, Zod+audit, compliance page /missions/[id]/compliance, PDF dossier pdf-lib, alertas expiracion pilotos+drones |
| 4C.1 — UI Cards | COMPLETADA | 2026-03-31 | Grid de tarjetas cuadradas para misiones, drones y pilotos (reemplazo tablas). Iconos SVG custom (cuadricoptero, people). Deploy automatico SSH a VPS |
| 4E.1 — AEMET Real | COMPLETADA | 2026-03-31 | AEMET OpenData activado (API key configurada). WeatherWidget muestra datos reales: temp, viento, precipitacion, aptoVuelo. Fallback estacional si API falla. Fix parser viento (pick max velocidad) |
| 4F — NOTAM + Email | COMPLETADA | 2026-04-06 | Capa NOTAM en mapa (ENAIRE NOTAM_UAS_APP_V3, 678 NOTAMs reales, cache 30min), email notifications (nodemailer + Google Workspace SMTP alias), templates HTML premium |
| 4G — Tests | COMPLETADA | 2026-04-06 | 153 tests Vitest: fleet schemas, NOTAM route (mock node:https), email notifications (mock nodemailer), state machine, compliance, PDF |
| 4H — Fleet Strip + Panel | COMPLETADA | 2026-04-06 | Dashboard fleet strip (drones+pilotos scroll horizontal), panel derecho permanente, ExpiryAlerts "Todo en regla" |
| 4I — Identity Sprint | COMPLETADA | 2026-04-06 | SRS Design System aplicado: paleta corporativa Skypro360, Barlow Condensed + JetBrains Mono, cockpit dark nativo, login/sidebar/markers/popups/badges |
| 4J — Cockpit + Light Mode | COMPLETADA | 2026-04-30 | Light/dark toggle (CSS custom properties + ThemeProvider), Cockpit overview home (KPIs + recientes + flota), Espacio OPS pestana dedicada con mapa, BOE Alerts widget, Weather location picker, popups NOTAM y misiones estables, manuales .docx para Fer y Luis |
| 4K — Sprint 1 Cierre | COMPLETADA | 2026-05-02 | RBAC roles+UI por perfil, cambio password obligatorio en primer login, reset password por email con token, backup automatico Postgres diario (cron 03:15 UTC), datos AESA del operador en tenant, drones reales en flota |
| 4L — Sprint 2 Pulido | COMPLETADA | 2026-05-02 | Mapa cambia tile style segun tema (positron/dark-matter), header PDF dossier con datos completos del operador AESA, email notifications cambios estado mision (ya cableadas) |
| 4M — Sprint 3 Cierre | EN CURSO | 2026-05-02 | Tests Vitest fix, CLAUDE.md actualizado, manuales v1.1, acta cierre fase 4. Notion SDDs diferido manual. |
| 4E — Advanced (5+) | DIFERIDA | — | AESA API real (no existe), telemetria real-time Socket.IO (necesita SDK fabricante), PWA offline-first (sprint v1.1 segun feedback) |

## Decision arquitectonica: Merge Strategy

**Base**: nuestro scaffold (`app/`) — auth limpia, env validation, tests, build compila, estructura consistente.

**Extraer de V2.6 de Luis** (EXTRACT+FIX):
- compliance/schema.ts: 5 tablas AESA (templates, planning A.4, preflight A.5/A.6, postflight A.7/A.8, incidents) — fix: tenant_id+FK en forms, timestamps tz, type exports
- compliance/service.ts: lifecycle formularios AESA con tx+audit — fix: Zod, unique constraint onConflict, tenant_id en inserts
- audit/schema.ts + service.ts: trazabilidad forense — fix: sessionId, withTimezone, indexes, Drizzle eq/and
- flight-ops/schema.ts: flight_logs — fix: import order bug, añadir FKs
- geo/schema.ts + service.ts: zones PostGIS — fix: boundary text→geometry real, spatial index, column name bug
- missions/service.ts: geo-validacion en create — fix: state machine, code gen, Zod
- reports/service.ts: PDF dossier pdf-lib — fix: operator info de tenant, seccion A.4
- reports/analytics.ts: metricas dashboard — fix: import and, withTenantContext
- shared/db/index.ts: withTenantContext — fix: wrappear en transaccion (set_config sin tx = leak)
- rls_policies.sql: RLS base — fix: faltan 6 tablas, WITH CHECK, FORCE RLS
- Componentes UI: SignaturePad, PlanningForm, PreFlightForm, PostFlightForm, IncidentForm, MapLibreView, Sidebar
- API routes forms (5): endpoints AESA — fix: Zod validation

**RECHAZAR de V2.6** (rehacer desde scaffold):
- auth/schema.ts (roles incorrectos, tenantId nullable, sin updatedAt)
- AuthContext.tsx (dual auth localStorage+NextAuth = agujero seguridad)
- fleet/service.ts (bypass RLS, bug updateHours args wrong order)
- flight-ops/service.ts (bug land() pasa duration como userId, sin audit, sin tenant check)
- /api/uas, /api/users, /api/batteries, /api/logs (raw SQLite, sin auth, sin tenant)
- /api/forms/conditions (raw SQLite)
- /api/auth/login (passwords texto plano)
- /api/missions/[id]/forms (args orden incorrecto)

**REFERENCIA de V2.6** (inspiracion, no codigo):
- fleet/schema.ts: columnas easaClass, mtomKg, insuranceExpiry → añadir a drones
- batteries route: concepto battery lifecycle → futuro fleet module
- road-events: ground safety zones → futuro geo
- economy route: mission cost tracking → fase 2

## Bugs conocidos de V2.6 (auditoria completa)

1. FlightOpsService.land() pasa durationMinutes/60 como userId (args wrong order) — horas vuelo nunca se actualizan
2. AnalyticsService: `and` importado despues de usarse — runtime ReferenceError
3. Migracion SQL desactualizada (no incluye compliance_templates, rpApproved, updatedAt)
4. PWA sync definida pero nunca conectada (no hay service worker)
5. FleetService queries sin withTenantContext() = cross-tenant data leak
6. /api/uas y /api/users usan raw SQLite con passwords texto plano
7. GeoService query usa columna `geometry` pero schema define `boundary` — query falla
8. ComplianceService onConflictDoUpdate en formPlanning sin unique constraint — falla en runtime
9. withTenantContext no wrappea en transaccion — set_config leak entre conexiones del pool
10. RLS solo cubre 6 de 14 tablas, sin WITH CHECK (writes no restringidos)
11. /api/missions/[id]/forms llama services con args en orden incorrecto
12. flight-ops/schema.ts usa integer antes de importarlo

## Stack

| Capa | Tecnologia |
|------|------------|
| Framework | Next.js 16 + React 19 + App Router |
| Lenguaje | TypeScript strict |
| Estilos | Tailwind CSS 4 + SRS Design System (Identity Sprint Skypro360) |
| Tipografia | Barlow Condensed (display) + Barlow (body) + JetBrains Mono (codigos) |
| Paleta | #080D14 bg · #0C9FD8 azul logo · #F04E1C naranja aviacion · always dark |
| Base de datos | PostgreSQL 16 + PostGIS (Drizzle ORM) |
| Cache/Sessions | Redis 7 (ioredis) |
| Auth | Auth.js (Credentials + bcrypt + JWT 24h) |
| Mapas | MapLibre GL JS |
| Validacion | Zod |
| Testing | Vitest (unit) + Playwright (e2e) |
| Infra | Docker Compose + Caddy |
| PDF | pdf-lib (dossier AESA) — de V2.6 |

## Puertos (offset +100)

| Servicio | Puerto | Bind |
|----------|--------|------|
| App (Next.js) | 3100 | localhost |
| PostgreSQL | 6100 | 127.0.0.1 |
| Redis | 6101 | 127.0.0.1 |
| Caddy HTTP | 3180 | 127.0.0.1 |
| Caddy HTTPS | 3143 | 127.0.0.1 |

## Arquitectura

Monolito modular. 9 modulos internos en `src/modules/`:

| Modulo | Responsabilidad | V2.6 aporte |
|--------|----------------|-------------|
| auth | Login, registro, sessions, RBAC | Rehacer (V2.6 tiene auth dual rota) |
| fleet | Drones, pilotos certificados | Rehacer (V2.6 no filtra por tenant) |
| missions | Lifecycle misiones, checklists | Schema OK, necesita state machine real |
| compliance | AESA forms A.4-A.8, firmas, templates | Extraer integro (lo mejor de V2.6) |
| flight-ops | Ejecucion vuelo, telemetria | Schema OK, corregir calculo horas |
| geo | Mapas, zonas aereas, PostGIS | Extraer service (ST_Contains, ST_Intersects) |
| reports | PDF dossier, exportaciones | Extraer PDF generation (pdf-lib) |
| integrations | AESA API, meteo, notificaciones | Nuevo |
| audit | Trazabilidad forense AESA | Extraer integro |

Regla de dependencia: modules -> lib -> config. Nunca module -> module directo.

### Comunicacion inter-modulo (ADR-9)

Patron: **Shared Query Layer** en `lib/db/queries/` + `lib/db/transactions/`.

```
src/lib/db/queries/          ← Lecturas compartidas (cualquier modulo importa)
  fleet.queries.ts           ← getDronesForTenant(), getAvailablePilots()
  missions.queries.ts        ← getMissionsByStatus(), getMissionWithAssignments()
  compliance.queries.ts      ← getPilotCertifications(), getExpiringDocs()

src/lib/db/transactions/     ← Escrituras cross-modulo atomicas
  complete-mission.tx.ts     ← Actualiza mision + horas piloto en 1 transaccion
```

**Regla:** Si solo 1 modulo lo usa → `modules/{mod}/queries/`. Si 2+ lo necesitan → sube a `lib/db/queries/`. Sin event bus, sin mediators — monolito simple.

## RBAC

5 roles: admin (SRS), org_admin (admin operador), pilot, coordinator, viewer

Reglas implementadas en `src/lib/auth/rbac.ts` + filtrado server-side en queries:

| Recurso | admin | org_admin | coordinator | pilot | viewer |
|---------|-------|-----------|-------------|-------|--------|
| Ver todas misiones del tenant | ✓ | ✓ | ✓ | solo suyas | ✓ |
| Crear/editar mision | ✓ | ✓ | ✓ | ✗ | ✗ |
| Borrar mision | ✓ | ✓ | ✗ | ✗ | ✗ |
| Aprobar mision | ✓ | ✓ | ✓ | ✗ | ✗ |
| Transicionar estado mision propia | ✓ | ✓ | ✓ | ✓ | ✗ |
| Gestionar flota (drones+pilotos) | ✓ | ✓ | ✗ | ✗ | ✗ |
| Firmar compliance AESA | ✓ | ✓ | ✗ | ✓ | ✗ |
| Generar dossier PDF | ✓ | ✓ | ✓ | ✓ | ✗ |
| Ver Analytics | ✓ | ✓ | ✓ | ✗ | ✗ |
| Gestionar usuarios | ✓ | ✓ | ✗ | ✗ | ✗ |

Helpers exportados: `canSeeAllMissions`, `canCreateMission`, `canEditMission`, `canDeleteMission`, `canApproveMission`, `canTransitionMission`, `canManageFleet`, `canManagePilots`, `canSignCompliance`, `canGenerateDossier`, `canManageUsers`, `canSeeAnalytics`. Server actions usan `requireRole(...)` para reforzar.

## Multi-tenant

tenant_id en todas las tablas de negocio. RLS via SET app.current_tenant_id.
Helper: setTenantContext() — MANDATORY, no opcional como en V2.6.

## Arranque rapido

```bash
cd app && npm install && npm run docker:up && npm run db:push && npm run db:seed && npm run dev
# http://localhost:3100 — admin@skypro360.es / admin12345
```

## Operaciones (VPS produccion)

- **URL**: https://skp360mgr.systemrapid.io
- **Deploy**: `ssh root@skp360mgr.systemrapid.io "cd /opt/apps/opsmanager && git pull origin main && cd app && docker compose -f docker-compose.prod.yml up -d --build"`
- **Backup BD**: cron `15 3 * * *` UTC, ejecuta `/opt/apps/opsmanager/ops/backup-postgres.sh`. Rotacion 14d/4w/6m en `/opt/apps/opsmanager/backups/`
- **Restore BD**: `/opt/apps/opsmanager/ops/restore-postgres.sh <ruta-backup>` (con safety backup pre-operacion automatico)
- **Health check**: `curl -sf http://localhost:3100/api/health`

## ADRs vigentes

1. Monolito modular (no microservicios)
2. PostgreSQL + PostGIS (no MongoDB)
3. Drizzle ORM (no Prisma)
4. Redis sessions (no solo JWT)
5. Docker + Caddy en VPS Hostinger
6. Multi-tenant desde dia 1
7. Stack difiere del estandar SRS
8. Scaffold propio como base, V2.6 como fuente de dominio (no fork)
9. Shared Query Layer para comunicacion inter-modulo (no event bus)
10. Auth evolutiva: Credentials ahora → OAuth additive despues (sin rewrite)
11. Tenant resolution: login-based ahora → subdomains con 3+ tenants

## Auth — Evolucion planificada

| Stage | Cuando | Que |
|-------|--------|-----|
| 1 (ahora) | Sprint 1 cierre 2026-05-02 | Credentials + bcrypt + JWT 24h, **mustChangePassword en primer login**, **reset password por email con token single-use 1h**, RBAC enforced en queries y UI |
| 2 | 2do tenant | Resolucion tenant por login (ya funciona), subdominios cuando 3+ |
| 3 | Enterprise | Providers OAuth (Google, Azure AD) coexisten con Credentials |
| 4 | Integraciones | Tabla api_keys + middleware propio, separado de Auth.js |

## Roadmap Fase 4 — Sub-fases

### 4A — Foundation (sem 1-2): Data layer + Fleet CRUD
1. Crear `src/lib/db/queries/` shared query layer
2. Crear `src/lib/db/transactions/` para escrituras cross-modulo
3. CRUD fleet: drones (list, create, edit, status changes)
4. CRUD fleet: pilots (list, create, edit, certificaciones)
5. PostGIS: columnas geometry en missions (location Point, flight_area Polygon)
6. RLS policies en tenants, users, drones, pilots, missions
7. Seed expandido: 3-5 drones reales, pilotos con certificaciones

### 4B — Core Product (sem 3-5): Missions lifecycle
1. CRUD misiones con state machine 8 estados: draft→planned→approved→preflight→in_flight→completed|aborted|cancelled
2. Validacion transiciones (no saltar estados)
3. Asignacion drone + piloto (validar disponibilidad via shared queries)
4. Auto-generacion codigo mision (SKY-2026-XXX por tenant)
5. Checklists: preflight (Apendice 4) + risk assessment (Apendice 6) — JSONB templates
6. Gate: mision no pasa a in_flight sin checklist preflight completo
7. Seed: 10-15 misiones en varios estados
8. Tests integracion: state machine + validacion cross-modulo

### 4C — Visualization (sem 5-6): Map + Dashboard
1. MapLibre GL JS componente cliente en dashboard home
2. Markers misiones en mapa (desde PostGIS Point)
3. Poligonos area vuelo (desde PostGIS Polygon)
4. Color-coding por status mision
5. Click marker → panel detalle
6. Dashboard stats: misiones activas, estado flota

### 4D — Compliance + Reports (sem 7-8)
1. Compliance: tracking documentos AESA, SORA, EARO
2. Alertas expiracion certificaciones piloto
3. Gestion estado registro drones
4. PDF reportes (Apendices 4-8) con pdf-lib
5. Checklist post-vuelo + reporte

### 4E — Advanced (sem 9+): Diferido, no MVP
1. AESA API integration (stub inicial)
2. Meteo (AEMET)
3. Telemetria real-time (Socket.IO)
4. NOTAM integration
5. Email notifications estado misiones
6. PWA offline-first

**MVP = 4A + 4B + 4C** — producto operativo para Skypro360.

## Design System

SRS Nucleus v2.0 aplicado. Identity Sprint Skypro360 documentado:

| Decision | Valor |
|----------|-------|
| Frase caracter | "Panel de control de misiones aereas — cockpit industrial" |
| Referencia | Logo corporativo Skypro360 (negro + azul electrico + naranja seguridad aviacion) |
| Fondo | #080D14 (negro azulado, siempre dark) |
| Primario | #0C9FD8 (azul electrico logo) |
| Acento | #F04E1C (naranja seguridad aviacion, wordmark) |
| Display | Barlow Condensed (industrial, aeronautica) |
| Body | Barlow |
| Mono | JetBrains Mono (codigos SKY-XXX, coords, S/N) |
| Signature motion | Spring lift en cards, pulse ring en status in_flight |

Design System SRS Notion: https://www.notion.so/SRS-Design-System-3397981f08ef81d7bd6cf83da8dba729

## Documentacion SDD

8 SDDs en Notion (pagina: 32c7981f-08ef-8134-84f2-e21d8661aa51)

## Codigo reutilizable

| Fuente | Que usar |
|--------|----------|
| V2.6 Luis | Compliance AESA, audit, geo PostGIS, PDF dossier, SignaturePad, forms UI, RLS base |
| overwatch | geo-service Copernicus, Socket.IO alerts, PDF patterns |
| dronehubsrs | PostgreSQL RLS reference |
| srs-crm-v3 | Docker deploy, Caddy config |

---

## Memory

### Me
JuanCho, fundador SRS. Desarrollo apps, automatizacion, Docker. Todo por Notion.

### People
| Who | Role |
|-----|------|
| JuanCho | Fundador SRS, lead tecnico y comercial |
| SA99 | Agente IA principal de SRS (Claude) |
| Luis | Skypro360 piloto/ops. Desarrollo V2.0-V2.6 portal |
| Ferenz | Skypro360 piloto/operaciones |

### Terms
SRS=System Rapid Solutions | SDD=System Design Document 8 secciones | ADR=Architecture Decision Record | SORA=Specific Ops Risk Assessment | EARO=Espacio Aereo Regulado | AESA=Agencia Estatal Seguridad Aerea | UAS=drone | V2.6=version Luis "Certified Final" | RP=Responsable Operaciones (firma SORA) | Apendice 4-8=formularios AESA Manual Ops

> Full: memory/glossary.md | memory/context/company.md

### Preferences
Directo, sin rodeos, sin emojis. Tecnico al grano. No repetir. No explicar de mas.
