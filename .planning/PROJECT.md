# Project Clip

## What This Is

Project Clip is a fork of Paperclip re-modeled for **consulting portfolios** — specifically CI&T Growth Units (GUs). Where Paperclip models one company with agents executing tasks, Project Clip models a **Portfolio** containing many **Clients**, each with **Projects** and optional **Teams** mixing humans and agents. It ships the **CPS (CI&T Production System) Body of Knowledge** baked in as the default framework, and lets each project pick a **Story Style** and one of nine **SDD Methods** — rendering progress natively in that method's phases and gates. Infrastructure runs on **Neon** (serverless Postgres + managed Better Auth 1.4.18) instead of embedded local Postgres.

## Core Value

A Growth Unit lead can open one screen and see every client engagement's CPS-phase health, risk signals, and method-aware progress — without spreadsheets, status calls, or tribal knowledge.

## Current Milestone: v0.1 Foundation

**Goal:** Establish a clean, running Project Clip platform — forked from Paperclip, rebranded, and migrated to Neon Auth + Neon Database — that passes all quality checks and is ready for feature development.

**Target features:**
- Fork Paperclip, initialize repo, configure semantic-release + CI, all quality checks pass (v0.0.1)
- Migrate authentication from self-hosted Better Auth to Neon Auth (v0.0.2)
- Migrate database from embedded/local Postgres to Neon Database (v0.0.3)
- Rebrand from Paperclip to Project Clip — zero "paperclip" occurrences in source (v0.0.4)

## Requirements

### Validated

- **Phase 1 (2026-04-14):** Paperclip monorepo imported at repo root; `pnpm` install/migrate, typecheck, Vitest, build, and Playwright e2e (skip-LLM) pass locally; GitHub Actions retargeted to **`main`**; **semantic-release** config + dry-run workflow on push to `main` (`npmPublish: false`). See `FORK_DIFF.md`.

### Active

- [x] Fork Paperclip and make it run with all existing quality checks passing
- [ ] Rebrand from Paperclip to Project Clip (zero "paperclip" occurrences in source)
- [ ] Migrate authentication from self-hosted Better Auth to Neon Auth
- [ ] Migrate database from embedded/local Postgres to Neon Database
- [ ] Implement Portfolio → Client → Project → (optional) Team hierarchy
- [ ] Encode the CPS three-phase lifecycle (Setup → Production Flow → Value Activation) with phases, gates, routines, and deliverable templates
- [ ] Ship Method Adapters for BMAD, Spec-Kit, Taskmaster, and CAPS (v1); remaining six adapters in v1.1+
- [ ] Extend ProjectDetail.tsx with method-aware phase strip, gate badges, and adapter-driven progress
- [ ] Build Portfolio dashboard with CPS-weighted health scoring and risk signals
- [ ] Wire routine scheduler so CPS routines produce deliverables automatically
- [ ] Seed role catalog from role-directory (47 normalized roles across 7 job families)
- [ ] Pilot with one Growth Unit (10 projects) and achieve NPS ≥ 8/10

### Out of Scope

- Client login / client-facing UI — Project Clip is CI&T-internal only
- Replacing Paperclip upstream — fork and contribute back compatible pieces
- Replacing client ticketing tools (Jira/Asana/ADO/Linear) — sync only, deferred to Epic 11
- Custom frameworks beyond CPS + 9 SDD methods in v1 — plugin interface arrives in v1.2
- Full financial forecasting / billing — read-only budget views only; revenue forecasting integrates with existing Portfolio Management Cockpit later
- Inventing new role titles — if a role isn't in role-directory, open a PR there first

## Context

- **Source fork:** `/Users/danielvm/Sites/paperclip` — full Paperclip codebase is the starting point. Paperclip already ships `projects`, `routines` (with `routine_triggers` + `routine_runs`), `goals`, `agents`, `issues`, `approvals`, and multi-tenant `companies`. Project Clip is a thin CPS/SDD layer on top.
- **CPS Body of Knowledge:** `/Users/danielvm/Sites/CPSBok` — three-phase lifecycle (Setup → Production Flow → Value Activation), grounded in Toyota Production System / Lean principles. Gate chapters: Ch.13 (Setup), Ch.30 (Production Flow), Ch.37 (Value Activation).
- **SDD Academy:** `/Users/danielvm/Sites/sdd-academy` — nine SDD methods. v1 ships BMAD, Spec-Kit, Taskmaster, and CAPS as Method Adapters; remaining six ship in v1.1+.
- **Role Directory:** `/Users/danielvm/Sites/role-directory` — 47 normalized roles across 7 job families in `old_docs/data/source_data/roles_catalog_complete.csv`. Role catalog seeded from here; no role is invented in Project Clip.
- **Tech stack (inherited from Paperclip):** Node 20+, TypeScript 5.7 strict, pnpm 9 monorepo, Express 5, Drizzle ORM ^0.38, React 19, Vite 6, Tailwind CSS v4, Vitest 3, Playwright.
- **Release discipline:** Conventional Commits + semantic-release. Epics 0–3 produce patch bumps (`v0.0.1`–`v0.0.4`); Epic 4+ produce minor bumps; `v1.0.0` = MVP GA.
- **Team size:** 3 engineers (2 full-stack + 1 AI/agent platform). ~27 weeks to `v1.0.0`.

## Constraints

- **Tech stack:** Must stay on Paperclip's stack (Node/TS/Express/Drizzle/React/Vite/Tailwind) to minimize fork drift — no framework swaps.
- **Database:** Neon Database (serverless Postgres) replaces embedded Postgres after Epic 3. All 56 existing Drizzle migrations must apply cleanly.
- **Auth:** Neon Auth (managed Better Auth 1.4.18) replaces self-hosted Better Auth. Auth data lives in `neon_auth` schema; existing auth-dependent features must still function.
- **Data model:** Additive only — existing Paperclip tables are never renamed or deleted. New entities: `clients`, `teams`, `team_members`, `phases`, `gates`, `routine_templates`, `deliverable_templates`, `deliverables`, `role_catalog`.
- **Roles:** All role assignments must reference `role_catalog` (seeded from role-directory) — no free-text role fields.
- **Internal only:** Clients never log in. No client-facing UI until Epic 11 ticketing bridge.
- **Quality gate (every release):** `pnpm install --frozen-lockfile` → typecheck → `pnpm test:run` → `pnpm build` → `pnpm test:e2e` — all five must pass before semantic-release runs.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fork Paperclip rather than build from scratch | Paperclip already solved atomic task execution, goal cascading, budgets, heartbeats, multi-tenant isolation, routines with cron/triggers, runtime skill injection | — Pending |
| Neon for auth and database | Branch-aware auth + serverless Postgres eliminates infrastructure toil; preview environments get their own auth + DB branches automatically | — Pending |
| CPS as default framework (opt-out-able) | CI&T's delivery methodology is already defined; encoding it turns aspiration into enforcement | — Pending |
| Method Adapter plugin API (not hardcoded SDD methods) | Adding method #10 = ship a new adapter package; no core changes required | — Pending |
| `Portfolio` maps to Paperclip's existing `companies` table | Reuses multi-tenant isolation, budgets, audit, plugin settings — no new tenant model needed | — Pending |
| Roles seeded from role-directory, not invented in-app | Single role vocabulary shared by Project Clip, pricing/finance, and HR; prevents naming drift | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-13 after milestone v0.1 Foundation started*
