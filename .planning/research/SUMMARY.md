# Project Research Summary

**Project:** Project Clip  
**Domain:** Internal consulting portfolio orchestration (Paperclip fork + CPS + SDD method adapters)  
**Researched:** 2026-04-13  
**Confidence:** HIGH for stack/features/architecture; MEDIUM for health-score formula and Neon Auth edge cases until integration testing

## Executive Summary

Project Clip should **extend** Paperclip rather than replace its core: new packages and additive DB schema preserve upstream alignment while delivering Portfolio → Client → Project → Team, CPS lifecycle, routine/deliverable templates, and method adapters. The **2026 baseline stack** stays Node/TypeScript/pnpm, Express 5, Drizzle, React/Vite/Tailwind — with **Neon Database** and **Neon Auth** (Better Auth–compatible; verify against current Neon docs during Epic 1–2) replacing embedded Postgres and self-hosted auth.

Research confirms a **sequential epic order**: runnable fork + CI → auth → database → rebrand → portfolio data model → CPS framework → method adapters → dashboard/routines → pilot → GA. The largest product risks are **fork drift**, **auth/session regressions**, and **tenant isolation** on new entities; Epic 11’s ticketing bridge adds **data-exfiltration** risk and is correctly deferred until the internal loop is stable.

## Key Findings

### Recommended Stack

Stay on Paperclip’s locked versions (Node 20+, TS ~5.7, pnpm 9, Express 5, Drizzle ^0.38, React 19, Vite 6, Tailwind v4). Add Neon’s serverless driver/pooler patterns for DB access; configure Neon Auth per [Neon Auth documentation](https://neon.com/docs/auth/overview). Avoid swapping ORM or frontend framework — fork drift cost dominates.

**Core technologies:**

- **Neon Database** — serverless Postgres with branching for preview/CI; target for all Drizzle migrations.  
- **Neon Auth** — managed auth branching with database; validate middleware parity with existing Better Auth usage.  
- **Drizzle** — keep as migration source of truth; additive tables/columns only for CPS/portfolio layer.  
- **Vitest + Playwright** — keep release quality gate unchanged.

### Expected Features

**Must have (table stakes):** secure sessions; tenant isolation; projects/issues/goals/budgets; routines; approvals; role catalog from role-directory; method-aware project UI for selected SDD methods.

**Should have (differentiators):** portfolio hierarchy; CPS phases/gates; routine + deliverable templates; portfolio health dashboard; four method adapters (BMAD, Spec-Kit, Taskmaster, CAPS) in v1.

**Defer (v2+ / later epics):** remaining SDD adapters (v1.1+); ticketing bridge (Epic 11); custom frameworks (v1.2 plugin); full revenue forecasting.

### Architecture Approach

Thin vertical: **UI pages** → **Express services/routes** → **packages** (`portfolio-core`, `cps-framework`, `method-adapters/*`, `deliverables`, `routines-cps`) → **Drizzle** → **Neon**. Reuse `companies` as portfolio tenant; add `clients`, `teams`, extend `projects`; add `phases`, `gates`, `routine_templates`, `deliverable_templates`, `deliverables`, `role_catalog`. Method adapters stay **out of core** via registry.

**Major components:**

1. **Auth + middleware** — Neon Auth session resolution for users and downstream agent/API behavior.  
2. **Portfolio domain** — clients, teams, extended projects, navigation.  
3. **CPS framework** — phases, gates, templates, seeded routines.  
4. **Method adapters** — pluggable phases/progress/renderers for ProjectDetail.  
5. **Execution + deliverables** — routine runs, document rendering, timeline.

### Critical Pitfalls

1. **Fork drift** — mitigate via extension packages and `FORK_DIFF.md`.  
2. **Auth regression** — full test matrix after Neon Auth.  
3. **Connection / latency** — pooler + benchmarks on Express + Drizzle.  
4. **Schema breakage** — additive, nullable columns; feature flags.  
5. **Tenant leakage** — enforce `company_id` patterns on all new queries.

## Implications for Roadmap

Suggested alignment with PRD epics (foundation first, product layers next):

### Phase block A: Foundation (Epics 0–3)

**Rationale:** Nothing portfolio/CPS can ship until fork runs on Neon with new identity.  
**Delivers:** CI-green fork, Neon Auth, Neon DB, Project Clip rebrand.  
**Addresses:** Stack table stakes; operational baseline.  
**Avoids:** Building CPS UI on broken auth/DB.

### Phase block B: Portfolio hierarchy (Epic 4)

**Rationale:** CPS attaches to **projects** under **clients** — need data model and CRUD UI.  
**Delivers:** `clients`, `teams`, project extensions, role catalog seed.  
**Avoids:** Pitfall 6 (tenant isolation) via careful query design + tests.

### Phase block C: CPS framework (Epic 5)

**Rationale:** Phases/gates/templates/routines depend on stable project entities.  
**Delivers:** CPS phases, gates, routine templates, deliverable templates, kickoff materialization.  
**Avoids:** “PDF CPS” with no executable routines.

### Phase block D: Method adapters (Epic 6)

**Rationale:** Core differentiator — depends on CPS/project stability.  
**Delivers:** Adapter API + BMAD, Spec-Kit, Taskmaster, CAPS; ProjectDetail method UI.  
**Avoids:** Pitfall 5 (API leakage) via frozen interface and package boundaries.

### Phase block E: Dashboard + routine depth (Epic 7)

**Rationale:** Portfolio health and deliverable rendering close the GU lead loop.  
**Delivers:** Portfolio dashboard, scoring, routine → deliverable → MD/DOCX.  
**Flags:** Health-score formula still needs product/analytics sign-off (PRD open question).

### Phase block F: Pilot → GA (Epics 8–9)

**Rationale:** Validate with real GU before declaring v1.0.0.

### Research Flags

- **Neon Auth + agents/API tokens:** Deeper spike during `/gsd-plan-phase` for Epic 1 if middleware differs from self-hosted.  
- **Health-score formula:** Requires stakeholder input — not purely technical.  
- **Epic 11 ticketing:** Dedicated threat model + redaction design — research at Epic 10–11 boundary.

### Phase Ordering Rationale

Dependencies flow **infrastructure → data model → CPS → methods → visibility → pilot**. Ticketing bridge last by design.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Locked by PROJECT.md + upstream; verify Neon Auth env/API at implementation |
| Features | HIGH | PRD and PROJECT.md are explicit; scoring details TBD |
| Architecture | HIGH | Brownfield extension pattern is clear |
| Pitfalls | MEDIUM–HIGH | Risks listed match PRD; concrete tests needed in execution |

**Overall confidence:** HIGH for direction; MEDIUM for integration details until Epics 1–2 are implemented.

### Gaps to Address

- **Health dashboard formula:** Define with stakeholders before Epic 7 planning.  
- **Neon Auth non-happy paths:** Document fallback to self-hosted Better Auth if required (PRD risk).  
- **role-directory sync:** PRD open — deploy-time CSV vs API; decide before Epic 4 hardening.

## Sources

### Primary

- [Neon Auth overview](https://neon.com/docs/auth/overview)  
- [Neon Database docs](https://neon.com/docs/introduction)  
- `.planning/PROJECT.md`  
- `projectclip-prd.md`  

### Secondary

- `.planning/research/STACK.md`, `FEATURES.md`, `ARCHITECTURE.md`, `PITFALLS.md`  

---
*Research completed: 2026-04-13*  
*Ready for roadmap: yes*
