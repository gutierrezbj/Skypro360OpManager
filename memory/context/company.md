# SRS — System Rapid Solutions | Company Context

## Tools & Systems

| Tool | Use |
|------|-----|
| Notion | Project management, SDDs, checklists, knowledge base |
| GitHub | Code repos (gutierrezbj org) |
| Docker + Caddy | Deployment on Hostinger VPS |
| Claude (SA99) | AI agent, architecture, code generation |

## Team

| Person | Role | Notes |
|--------|------|-------|
| JuanCho | Founder, lead tech + commercial | Everything goes through him |
| Luis | Skypro360 pilot/ops | Developed V2.0-V2.6 portal, hands-on coder |
| Ferenz | Skypro360 pilot/ops | Field operations |

## Processes

| Process | Description |
|---------|-------------|
| Kickoff Protocol | 8-phase project initiation. No phase skipped. |
| SDD Methodology | 8 mandatory docs before code. |
| Port Convention | Base ports + offset per project. OpsManager = +100 |

## Kickoff Protocol (8 fases)

| Fase | Nombre | Actividades |
|------|--------|-------------|
| 0 | Ideacion | Brainstorming, viabilidad, GO/NO-GO |
| 1 | Setup Notion | Pagina proyecto, estructura SDD, subcarpetas |
| 2 | Documentacion SDD | 8 secciones SDD + revision cruzada |
| 3 | Reserva Infra | Puertos, dominio, Catalogo SRS |
| 4 | Desarrollo Local | MVP siguiendo SDD |
| 5 | Deploy Staging | QA en servidor real |
| 6 | Deploy Produccion | Live con SSL + monitoring |
| 7 | Cierre | Catalogo actualizado, Manifiesto cerrado |

Plantilla Notion: 3257981f-08ef-8191-b135-d5da2bc759d1

## Projects

| Proyecto | Offset | Estado | Notion ID |
|----------|--------|--------|-----------|
| OpsManager | +100 | Fase 4 (Desarrollo Local) | 32c7981f-08ef-8134-84f2-e21d8661aa51 |
| Moeve-T | TBD | Fase 0 | TBD |

## Key Notion IDs

- Catalogo Infraestructura: 3217981f-08ef-8182-8e31-edfcc9b78414
- Manifiesto SDD-SRS: 2f67981f-08ef-8164-9634-eb77d65a0c48
- Kickoff Template: 3257981f-08ef-8191-b135-d5da2bc759d1
- OpsManager main: 32c7981f-08ef-8134-84f2-e21d8661aa51
- OpsManager Checklist: 32c7981f-08ef-8128-ad73-f3cbbfdb8bb5

## GitHub Repos (reutilizables para OpsManager)

| Repo | Relevancia |
|------|-----------|
| overwatch | geo-service Copernicus, Socket.IO, PDF, CI/CD, Docker Compose |
| dronehubsrs | PostgreSQL RLS, pilot certifications |
| srs-crm-v3 | Docker multi-env, deploy scripts, Caddy |
| fitolink | Async worker pattern |

## Luis V2.6 Analysis (2026-03-26)

V2.6 "Certified Final" entregada con compliance AESA funcional.
Decision: usar nuestro scaffold como base + extraer dominio AESA de V2.6.
Ver CLAUDE.md seccion "Decision arquitectonica: Merge Strategy" para detalles.
