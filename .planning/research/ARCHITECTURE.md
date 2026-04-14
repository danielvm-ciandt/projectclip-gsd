# Architecture Research

**Domain:** Multi-tenant agent orchestration + consulting portfolio layer (brownfield fork)  
**Researched:** 2026-04-13  
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                         Clients (Browser)                             │
├────────────────────────────────────────────────────────────────────┤
│  React 19 SPA (Vite) — Portfolio, Clients, Projects, Teams,         │
│  ProjectDetail (method strip), Routines, Deliverables               │
├───────────────────────────────┬────────────────────────────────────┤
│      Express 5 API + WS       │     Plugin / sandbox runtime       │
│  (routes, services, auth      │     (ticketing adapters later)       │
│   session resolution)         │                                     │
├───────────────────────────────┴────────────────────────────────────┤
│  Domain packages: portfolio-core, cps-framework, method-adapters/*,   │
│  deliverables, routines-cps, role-catalog                           │
├────────────────────────────────────────────────────────────────────┤
│  Drizzle ORM ──────────────────────────────▶ Neon (serverless PG)   │
│  neon_auth schema (Neon Auth) │ app schemas (existing + additive)   │
└────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `companies` (Portfolio) | Tenant boundary, budgets, settings | Existing Paperclip — extend with profile side table optional |
| `clients`, `teams`, `team_members` | Account + staffing under project | New tables; FK to `company_id` / `project_id` |
| `projects` | Engagement unit | Extend: `client_id`, `framework`, CPS/SDD/story fields |
| `phases`, `gates` | CPS + method lifecycle | New; gates tie to `approvals` |
| `routine_templates` → `routines` | Executable CPS rituals | Instantiate on kickoff; reuse triggers/runs |
| `deliverable_templates` → `deliverables` | Artifacts | Render pipeline to `documents` |
| Method adapter registry | SDD-specific phases/progress | In-code registry + packages under `packages/method-adapters/*` |
| Auth | Sessions, OAuth | Neon Auth — middleware resolves user/session like today |

## Recommended Project Structure (from PRD)

```
packages/
  portfolio-core/
  cps-framework/
  role-catalog/
  method-adapters/{bmad,spec-kit,taskmaster,caps,...}
  deliverables/
  routines-cps/
  ticketing-adapters/   # Epic 11
server/src/services/    # portfolio, clients, teams, deliverables, phases, gates, method-adapters
ui/src/pages/           # Portfolio, Client*, Project*, Team*, extended ProjectDetail
```

## Data Flow (Happy Path)

1. User authenticates via Neon Auth → session available to API and agent operations.
2. Portfolio lead opens **Portfolio** → aggregates per client/project health (later: scores).
3. **Kickoff** creates/updates project → CPS templates → routine instances + triggers.
4. **Method adapter** computes progress from issues/deliverables/gates → **ProjectDetail** renders method-native UI.
5. **Routines** run on schedule/events → produce deliverables → stored as documents / timeline.

## Build Order (Dependency)

1. Fork runs + CI green (Epic 0)  
2. Neon Auth (Epic 1) — session compatibility for agents/API  
3. Neon DB (Epic 2) — migrations on branch  
4. Rebrand (Epic 3)  
5. Portfolio hierarchy (Epic 4) — data + UI  
6. CPS framework (Epic 5) — phases/gates/templates/routines  
7. Method adapters (Epic 6) — ProjectDetail  
8. Dashboard + execution depth (Epic 7) — health, rendering  

## Integration Boundaries

| Boundary | Contract |
|----------|----------|
| Method Adapter API | `registerMethodAdapter({ id, phases, deliverables, progressFn, routines, renderer })` — version after Epic 6 freeze |
| Routine template DSL | YAML front-matter + prompts → existing scheduler |
| Ticketing bridge | Epic 11; sandboxed credentials; redaction before outbound |

## Sources

- `projectclip-prd.md` §12–13 — data model delta and architecture
- `.planning/codebase/ARCHITECTURE.md` — if present, reconcile during implementation

---
*Architecture research for: Project Clip*  
*Researched: 2026-04-13*
