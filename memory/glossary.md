# Glossary — SRS / OpsManager

## Acronyms (General SRS)

| Acronym | Meaning |
|---------|---------|
| SRS | System Rapid Solutions |
| SDD | System Design Document (8 secciones obligatorias) |
| ADR | Architecture Decision Record |
| RLS | Row-Level Security (PostgreSQL) |
| RBAC | Role-Based Access Control |

## Acronyms (Aviation / Drones)

| Acronym | Meaning |
|---------|---------|
| AESA | Agencia Estatal de Seguridad Aerea (regulador espanol) |
| SORA | Specific Operations Risk Assessment |
| EARO | Espacio Aereo Regulado para Operaciones |
| UAS | Unmanned Aircraft System (drone) |
| VLOS | Visual Line of Sight |
| BVLOS | Beyond Visual Line of Sight |
| SAIL | Specific Assurance and Integrity Level (I-VI) |
| NOTAM | Notice to Airmen |
| ENAIRE | Gestor de navegacion aerea de Espana |
| ConOps | Concept of Operations |
| RP | Responsable de Operaciones (firma requerida SORA) |

## Internal Terms

| Term | Meaning |
|------|---------|
| Offset | Puerto base + offset por proyecto. OpsManager = +100 |
| Blueprint | Documento arquitectura tecnica de un proyecto |
| Kickoff | Protocolo inicio proyecto SRS (8 fases) |
| Navegante | Apodo de Claude/SA99 en contexto OpsManager |
| Expediente | Dossier completo de mision (formularios + firmas + PDF) |
| V2.6 | Version de Luis "Certified Final" del portal Skypro360 |
| Apendice 4 | Formulario planificacion mision (AESA) |
| Apendice 5/6 | Checklist preflight (AESA) |
| Apendice 7/8 | Checklist postflight (AESA) |

## OpsManager-Specific

| Term | Meaning |
|------|---------|
| SKY-YYYY-XXX | Formato codigo mision (ej: SKY-2026-001) |
| Checklist 0.4/0.6 | Apendices del Manual de Operaciones |
| withTenantContext | Helper PostgreSQL para activar RLS por sesion |

## Stack Comparison

| Aspecto | SRS Standard | OpsManager | ADR |
|---------|-------------|------------|-----|
| Frontend | Nuxt 3 | Next.js 16 | ADR-007 |
| DB | MySQL | PostgreSQL + PostGIS | ADR-002 |
| ORM | Prisma | Drizzle | ADR-003 |
| Sessions | JWT only | Redis + JWT | ADR-004 |
| Deploy | Docker + Nginx | Docker + Caddy | ADR-005 |

## Project Nicknames

| Nickname | Project |
|----------|---------|
| OpsManager | Skypro360 Operations Manager |
| Overwatch | Plataforma alertas satelitales + drones inspeccion |
| Moeve-T | Experiencia carga EV (cliente MOEVE) |
