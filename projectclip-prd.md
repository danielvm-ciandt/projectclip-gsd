# Product Brief — **Project Clip**

*A Paperclip-derived, CPS-native orchestration platform for consulting portfolios, with built-in SDD methods and deliverable templates.*

**Author:** Daniel V.M.
**Date:** 2026-04-13
**Status:** Draft v1.0 — release-aligned edition (grounded against the local Paperclip codebase, CPSBok, role-directory, and Neon platform)
**Related references:**
- Paperclip (base to fork) — https://github.com/paperclipai/paperclip (local: `/Users/danielvm/Sites/paperclip`)
- CPS Body of Knowledge — https://github.com/danielvm-ciandt/CPSBok (local: `/Users/danielvm/Sites/CPSBok`)
- SDD Academy (selectable build methods) — https://sdd-academy.vercel.app/methods/ (local: `/Users/danielvm/Sites/sdd-academy`)
- Role Directory (canonical role catalog) — local: `/Users/danielvm/Sites/role-directory` (47 normalized roles across 7 job families; see §6.2)
- Neon Auth — https://neon.com/docs/auth/overview
- Neon Database — https://neon.com/docs/introduction
- Semantic Release — https://github.com/semantic-release/semantic-release
- Conventional Commits — https://www.conventionalcommits.org/en/v1.0.0/

---

## 1. Executive Summary

**Project Clip** is a fork of Paperclip, re-modeled for **consulting portfolios** instead of single zero-human companies. Paperclip models one company with agents executing tasks; Project Clip models a **Portfolio** (Growth Unit or practice) containing many **Clients**, each with **Projects** and — for larger engagements — **Teams** mixing humans and agents.

Project Clip ships with the **CPS (CI&T Production System) Body of Knowledge** baked in as the default org framework — roles, rituals, deliverable templates, and pre-built routines — so every project is CPS-compliant from Day 0. CPS defines a three-phase lifecycle (**Setup → Production Flow → Value Activation**) with explicit gates between phases, grounded in Toyota Production System / Lean principles adapted for software delivery.

Each project picks a **Story Style** (how work is described and sized) and an **SDD Method** (BMAD, Spec-Kit, GSD, OpenSpec, AI-SDD, SpecPulse, Spec Workflow MCP, ANWS, or Taskmaster) at kickoff; the **Project Detail** page renders status and progress natively in that method's phases, gates, and artifacts.

**Crucial insight from the local Paperclip repo:** Paperclip already ships with `projects`, `routines` (with `routine_triggers` + `routine_runs`), `goals`, `agents`, `issues`, `approvals`, and multi-tenant `companies`. The fork doesn't need to invent those. Project Clip is therefore a **thin CPS/SDD layer on top of Paperclip**, not a rewrite:

- **Portfolio** ← maps to Paperclip's existing `companies` (multi-tenant isolation reused).
- **Client** ← new entity between Company and Project.
- **Project** ← existing `projects` table, extended with `framework`, `cps_phase`, `sdd_method`, `story_style`.
- **Team** ← new optional entity under Project.
- **Routines** ← existing `routines` infrastructure, seeded with CPS canonical routines.
- **Deliverables / Templates / Phases / Gates / Method Adapters** ← new, shipped as CI&T-owned packages.

**Infrastructure pivot:** Paperclip runs on embedded/local PostgreSQL with self-hosted Better Auth 1.4.18. Project Clip migrates to **Neon** — Neon Auth (managed Better Auth 1.4.18) for authentication and Neon Database (serverless Postgres) for data — gaining database branching, preview-environment auth, and zero server management.

### 1.1 Why now

1. Paperclip has already solved the hard parts: atomic task execution, goal cascading, budgets, heartbeats, multi-tenant isolation, routines with cron/triggers, runtime skill injection. Forking and extending beats building from scratch.
2. CI&T's CPS already defines *how* projects should be run; today it lives in docs and muscle memory. Encoding it into tooling turns it from aspirational to enforced (and measurable).
3. SDD is fragmenting: nine viable methods in SDD Academy, each with different phases and artifacts. Teams need a method-aware tool so the same platform tracks a BMAD project and a Spec-Kit project correctly — without forcing everyone onto one method.
4. Agentic SDLC is scaling up in 2026; the portfolio layer (above single-agent orchestration) is the missing piece between individual dev tools and executive portfolio cockpits.
5. Neon's branch-aware auth and serverless Postgres eliminate infrastructure toil; the team spends zero time managing database servers or auth infrastructure.

### 1.2 Non-goals (v1)

- **Client login / client-facing UI.** Project Clip is CI&T-internal. Clients do not access it; they see Project Clip's output through their own ticketing tool via the bridge in §13.3.
- Replacing Paperclip upstream — we fork and contribute back compatible pieces (the CPS framework, the Method Adapter API), not rewrite.
- Replacing client ticketing tools (Jira / Asana / ADO / Linear). Those are the client's source of truth for the client; Project Clip syncs with them rather than competing.
- Supporting arbitrary custom frameworks in v1. CPS + the nine SDD methods are the shipped set. Custom frameworks arrive in v1.2 via a framework plugin interface.
- Full financial forecasting/billing. Read-only budget views are in scope (Paperclip already has `budgets`, `budget_policies`, `cost_events`, `finance_events`); revenue forecasting is deferred to an integration with the existing **Portfolio Management Cockpit**.
- Inventing new role titles. Roles come from the normalized `role-directory` (§6.2).

---

## 2. Release Strategy — Semantic Release & Conventional Commits

Project Clip uses [semantic-release](https://github.com/semantic-release/semantic-release) for fully automated version management and [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) for commit message discipline.

### 2.1 Version semantics

Versions follow [SemVer 2.0.0](https://semver.org/) and are determined automatically from commit messages:

| Commit type | Release effect | Example |
|---|---|---|
| `fix(<scope>): ...` | **Patch** (0.0.x) | `fix(auth): correct cookie domain for Neon Auth` |
| `feat(<scope>): ...` | **Minor** (0.x.0) | `feat(portfolio): add client hierarchy` |
| `feat(<scope>)!: ...` or footer `BREAKING CHANGE:` | **Major** (x.0.0) | `feat(api)!: replace REST with tRPC` |
| `chore`, `docs`, `test`, `ci`, `refactor`, `style` | No release | `chore(deps): update drizzle to 0.39` |

### 2.2 Pre-1.0 bootstrapping phase

Epics 0–3 are foundational infrastructure work that brings the fork to a runnable state. All commits in this phase use the `fix` type (bootstrapping = fixing the initial non-functional state), producing **patch** bumps: `0.0.1` → `0.0.2` → `0.0.3` → `0.0.4`.

Starting at Epic 4, real features land. Commits use `feat`, producing **minor** bumps: `0.1.0`, `0.2.0`, etc.

Version `1.0.0` marks MVP GA — the first production-ready release.

### 2.3 Branch strategy

| Branch | Purpose | Releases |
|---|---|---|
| `main` | Release branch — every merge triggers semantic-release | Automated tags + GitHub releases + CHANGELOG |
| `epic/<N>-<slug>` | Epic branches — one per epic, merged to `main` via PR | One release per epic merge |
| `feat/<scope>/<description>` | Feature branches within an epic | Merged to epic branch |
| `fix/<scope>/<description>` | Bug-fix branches | Merged to epic branch or directly to `main` (hotfix) |

### 2.4 Release toolchain

```
semantic-release
├── @semantic-release/commit-analyzer     (angular preset)
├── @semantic-release/release-notes-generator
├── @semantic-release/changelog           (auto-generates CHANGELOG.md)
├── @semantic-release/npm                 (version bump in package.json)
├── @semantic-release/github              (GitHub release + tag)
└── @semantic-release/git                 (commit CHANGELOG + version back)
```

### 2.5 Quality gate — every release

Every merge to `main` must pass before semantic-release runs:

1. `pnpm install --frozen-lockfile`
2. `pnpm -r typecheck` (TypeScript `tsc --noEmit` across all packages)
3. `pnpm test:run` (Vitest across all workspace projects)
4. `pnpm build` (full production build)
5. `pnpm test:e2e` (Playwright end-to-end, when applicable)

A release is created only if all five gates pass and at least one `fix` or `feat` commit exists since the last tag.

---

## 3. Epic-Release Map

Each epic produces exactly one mandatory release when merged to `main`. Epics are sequential — each builds on the previous release.

### Epic 0 — `v0.0.1` — Fork & Boot

**Goal:** Copy Paperclip as-is into the new Project Clip repository and make it run, passing all existing quality checks.

| Item | Detail |
|---|---|
| **Source** | `/Users/danielvm/Sites/paperclip` (local clone) |
| **Actions** | Copy entire codebase into new repo; initialize git with `v0.0.0` tag; configure semantic-release + Conventional Commits; set up CI pipeline (typecheck, test, build, e2e); configure `.releaserc` |
| **Exit criteria** | `pnpm install` succeeds; `pnpm -r typecheck` passes; `pnpm test:run` passes; `pnpm build` succeeds; `pnpm test:e2e` passes; semantic-release dry-run succeeds; CI pipeline green |
| **Commit types** | `fix(bootstrap): ...` |
| **Release** | `v0.0.1` (patch) |
| **Duration** | 1 week |

### Epic 1 — `v0.0.2` — Neon Auth

**Goal:** Migrate authentication from self-hosted Better Auth to Neon Auth. A functional login page powered by Neon Auth is the entry point to the application.

| Item | Detail |
|---|---|
| **Neon Auth** | Managed Better Auth 1.4.18 — same version Paperclip already uses. Auth data lives in `neon_auth` schema in the Neon database. Supports email/password, OAuth (Google out-of-box), sessions, and branch-aware auth for preview environments. |
| **Actions** | Enable Neon Auth on the Neon project; replace `server/src/auth/better-auth.ts` config to use `@neondatabase/auth` SDK instead of self-hosted `better-auth`; update environment variables (`NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`); remove `BETTER_AUTH_SECRET` fallback; implement login page using Neon Auth UI components or custom UI calling the auth API; update middleware (`server/src/middleware/auth.ts`) to resolve Neon Auth sessions; update Docker/CI environment; update Drizzle schema to reference `neon_auth` schema tables |
| **Exit criteria** | Login page renders and authenticates via Neon Auth; session management works; existing auth-dependent features (agent auth, API tokens) still function; all quality checks pass |
| **Commit types** | `fix(auth): ...` |
| **Release** | `v0.0.3` (patch) |
| **Duration** | 1–2 weeks |
| **References** | https://neon.com/docs/auth/overview, https://neon.com/docs/auth/quick-start/react |

### Epic 2 — `v0.0.3` — Neon Database

**Goal:** Migrate the database from embedded/local PostgreSQL to Neon Database (serverless Postgres). All existing data, migrations, and queries work against Neon.

| Item | Detail |
|---|---|
| **Neon DB** | Serverless Postgres with autoscaling, branching, and instant restore. Compatible with standard Postgres wire protocol — Drizzle ORM works unchanged. |
| **Actions** | Create Neon project and database; update `DATABASE_URL` to Neon connection string (with `?sslmode=require`); update `packages/db/src/client.ts` to use `@neondatabase/serverless` driver (or standard `postgres` with SSL); run all 56 existing Drizzle migrations against Neon; remove embedded-postgres dependency and patches; configure database branching for dev/preview environments; update Docker Compose to remove local Postgres service (dev uses Neon branches); update CI to use Neon branch per PR |
| **Exit criteria** | Application boots against Neon DB; all migrations apply cleanly; all existing tests pass against Neon; database branching works for dev workflow; embedded-postgres removed from dependencies; all quality checks pass |
| **Commit types** | `fix(db): ...` |
| **Release** | `v0.0.4` (patch) |
| **Duration** | 1–2 weeks |
| **References** | https://neon.com/docs/introduction, https://neon.com/docs/get-started/connect-neon |

### Epic 3 — `v0.0.4` — Rebrand to Project Clip

**Goal:** Remove all Paperclip references and rename to Project Clip. The application runs under the new identity, passing all quality checks.

| Item | Detail |
|---|---|
| **Actions** | Rename packages (`@paperclipai/*` → `@projectclip/*`); update `package.json` names, descriptions, repository URLs; rename CLI (`paperclipai` → `projectclip`); update UI branding (logos, titles, meta tags); update Docker image names; update environment variable prefixes (`PAPERCLIP_*` → `PROJECTCLIP_*`); update all import paths; update documentation; maintain `FORK_DIFF.md` |
| **Exit criteria** | Zero occurrences of "paperclip" in source (except `FORK_DIFF.md` and historical references); all quality checks pass; application boots and serves the renamed UI; CLI responds to `projectclip` command |
| **Commit types** | `fix(rebrand): ...` |
| **Release** | `v0.0.2` (patch) |
| **Duration** | 1–2 weeks |

### Epic 4 — `v0.1.0` — Portfolio Hierarchy

**Goal:** Implement the Portfolio → Client → Project → (optional) Team hierarchy on top of the rebranded, Neon-backed platform.

| Item | Detail |
|---|---|
| **Actions** | Create `clients` table (Drizzle migration); create `teams` and `team_members` tables; extend `projects` with `client_id`, `framework`, `cps_phase_id`, `sdd_method_id`, `story_style`; create `role_catalog` table seeded from role-directory; build `Clients.tsx`, `ClientDetail.tsx`, `Teams.tsx`, `TeamDetail.tsx` pages; extend `Projects.tsx` with client/team filters; build server services and API routes for new entities |
| **Exit criteria** | Full CRUD on Client, Team, and extended Project; role catalog seeded and queryable; navigation from Portfolio → Client → Project → Team works; all quality checks pass |
| **Commit types** | `feat(portfolio): ...`, `feat(clients): ...`, `feat(teams): ...` |
| **Release** | `v0.1.0` (minor — first feature release) |
| **Duration** | 3 weeks |

### Epic 5 — `v0.2.0` — CPS Framework

**Goal:** Encode the CI&T Production System three-phase lifecycle (Setup → Production Flow → Value Activation) with phases, gates, routines, and deliverable templates.

| Item | Detail |
|---|---|
| **CPS phases** | **Setup** (chapters 04–13, 1–3 weeks): vision, setup plan, client commitment, team building, PO coaching, backlog development, value engineering. **Production Flow** (chapters 14–30, ongoing sprints): architecture, backlog refinement, value governance, monitoring, rituals, quality, continuous improvement. **Value Activation** (chapters 31–37, 1–2 weeks): production entry, impediment management, late homologation, change management. |
| **CPS gates** | Setup → Production Flow (Ch.13 Evaluate Inputs: go/conditional-go/no-go); Sprint-level evaluation (Ch.30); Value Activation closure (Ch.37). |
| **CPS rituals** | Sprint Planning, Daily Standup, Sprint Review, Sprint Retrospective (Ch.23), plus Setup kickoff, QBR, risk scan, closeout. |
| **CPS roles** | PM, SM/Squad Leader, PO, Dev, QA, Client representative, Architect — mapped to `role_catalog` entries from role-directory. |
| **Actions** | Create `phases` table with CPS phase definitions; create `gates` table wired to `approvals`; create `routine_templates` table seeded with CPS rituals; create `deliverable_templates` table seeded with CPS templates (from CPSBok Appendix B); build `cps-framework` package; extend project creation (`/kickoff`) to materialize CPS templates into live routines; build gate-approval UI |
| **Exit criteria** | New project defaults to CPS framework; three phases with gates render on project detail; routine templates materialize on kickoff; deliverable templates are available per phase; gate approvals block phase transitions; all quality checks pass |
| **Commit types** | `feat(cps): ...`, `feat(phases): ...`, `feat(gates): ...`, `feat(routines): ...`, `feat(deliverables): ...` |
| **Release** | `v0.2.0` (minor) |
| **Duration** | 4 weeks |

### Epic 6 — `v0.3.0` — SDD Method Adapters

**Goal:** Ship method adapters for BMAD, Spec-Kit, and Taskmaster (the three most cross-cutting for CI&T today), plus CAPS (CI&T Agentic Production System, derived from CPS). The Project Detail page renders method-aware phases and progress.

| Item | Detail |
|---|---|
| **Actions** | Define Method Adapter API (`registerMethodAdapter({ id, phases, deliverables, progressFn, routines, renderer })`); implement BMAD adapter (Analysis → Planning → Solutioning → Implementation); implement Spec-Kit adapter (Constitution → Specify → Clarify → Plan → Tasks → Implement); implement Taskmaster adapter (Write PRD → Parse → Analyze → Expand → Implement); implement CAPS adapter (CPS-native agentic workflow); extend `ProjectDetail.tsx` with phase strip, gate badges, adapter-driven progress; build Story Style selector (5 styles) |
| **Exit criteria** | Project creation offers SDD method + Story Style selection; ProjectDetail renders the selected method's phases, gates, and progress; all four adapters pass their own test suites; all quality checks pass |
| **Commit types** | `feat(method-adapters): ...`, `feat(bmad): ...`, `feat(spec-kit): ...`, `feat(taskmaster): ...`, `feat(caps): ...` |
| **Release** | `v0.3.0` (minor) |
| **Duration** | 4 weeks |

### Epic 7 — `v0.4.0` — Portfolio Dashboard & Routine Execution

**Goal:** Portfolio-level health dashboard with CPS-weighted scoring; scheduled routines produce deliverables; deliverables render to Markdown and DOCX.

| Item | Detail |
|---|---|
| **Actions** | Build `Portfolio.tsx` with CPS-weighted health rollup per client and project; implement health-score formula (gate passage, ritual compliance, deliverable completion, budget health); wire routine scheduler to produce deliverables on cron/trigger; implement deliverable rendering (MD and DOCX via existing skill infrastructure); extend `RoutineDetail.tsx` with CPS phase + deliverable linkage |
| **Exit criteria** | Portfolio dashboard shows health scores, risk signals, margin indicators; `/weekly-heartbeat` routine runs on schedule and produces a draft status update; deliverables render to MD and DOCX and attach to project timeline; all quality checks pass |
| **Commit types** | `feat(dashboard): ...`, `feat(health): ...`, `feat(rendering): ...` |
| **Release** | `v0.4.0` (minor) |
| **Duration** | 3 weeks |

### Epic 8 — `v0.5.0` — Pilot

**Goal:** Pilot with one Growth Unit (10 projects). Validate CPS compliance, method-aware tracking, and routine execution with real engagements.

| Item | Detail |
|---|---|
| **Actions** | Onboard pilot GU; seed real client and project data; run CPS routines for 4 weeks; collect feedback; fix P0/P1 bugs; performance tune; add onboarding flow |
| **Exit criteria** | NPS from GU lead ≥ 8/10; ≥ 70% adoption on pilot projects; zero P0 bugs open; all quality checks pass |
| **Commit types** | `fix(pilot): ...`, `feat(onboarding): ...` |
| **Release** | `v0.5.0` (minor) |
| **Duration** | 4 weeks |

### Epic 9 — `v1.0.0` — MVP GA

**Goal:** General availability. Docs complete, second GU signed up, production hardened.

| Item | Detail |
|---|---|
| **Actions** | Finalize documentation; complete onboarding flow; second GU onboarded; production monitoring and alerting; security audit; performance baseline |
| **Exit criteria** | Two GUs active; docs published; zero P0/P1 bugs; SLA defined and met; all quality checks pass |
| **Commit types** | `feat(ga): ...` or `fix(ga): ...` depending on content |
| **Release** | `v1.0.0` (major — first stable release) |
| **Duration** | 2 weeks |

### Epic 10 — `v1.1.0`+ — Remaining Method Adapters

**Goal:** Ship the remaining six SDD method adapters, one per sprint.

| Item | Detail |
|---|---|
| **Methods** | GSD, OpenSpec, AI-SDD, SpecPulse, Spec Workflow MCP, ANWS |
| **Commit types** | `feat(gsd): ...`, `feat(openspec): ...`, etc. |
| **Release** | `v1.1.0` through `v1.6.0` (one minor per adapter) |
| **Duration** | 6 weeks (1 per sprint) |

### Epic 11 — `v1.7.0`+ — Ticketing Bridge

**Goal:** Two-way sync between Project Clip and client ticketing tools (Jira → Asana → ADO → Linear). See §13.3 for full scope.

| Item | Detail |
|---|---|
| **Commit types** | `feat(ticketing): ...`, `feat(jira): ...`, etc. |
| **Release** | `v1.7.0`+ (one minor per adapter) |
| **Duration** | 6 weeks |

### 3.1 Release timeline summary

```
Week  Epic                            Release    Type
────  ──────────────────────────────  ─────────  ──────
1     Epic 0 — Fork & Boot           v0.0.1     patch
2–3   Epic 1 — Rebrand               v0.0.2     patch
4–5   Epic 2 — Neon Auth             v0.0.3     patch
6–7   Epic 3 — Neon Database         v0.0.4     patch
8–10  Epic 4 — Portfolio Hierarchy   v0.1.0     minor
11–14 Epic 5 — CPS Framework         v0.2.0     minor
15–18 Epic 6 — Method Adapters       v0.3.0     minor
19–21 Epic 7 — Dashboard & Routines  v0.4.0     minor
22–25 Epic 8 — Pilot                 v0.5.0     minor
26–27 Epic 9 — MVP GA               v1.0.0     major
28–33 Epic 10 — Remaining Adapters   v1.1–1.6   minor
34–39 Epic 11 — Ticketing Bridge     v1.7.0+    minor
```

**Total: ~27 weeks to v1.0.0 GA; ~39 weeks to v1.7.0+ with ticketing bridge**, on a 3-engineer team (2 full-stack + 1 AI/agent platform).

---

## 4. Problem & Opportunity

### 4.1 Problems today

- **Portfolios are invisible.** A GU lead running 8–20 client engagements relies on a patchwork of status decks, spreadsheets, and calls. There is no single source of truth for "health of the portfolio."
- **Projects drift from the CPS.** Teams know the CI&T Production System exists, but there is no default scaffolding — each project improvises roles, artifacts, and rituals. Quality varies by lead.
- **Method sprawl is real.** Dev teams are adopting SDD methods individually. Status reporting has no shared vocabulary, so leadership can't compare progress across projects.
- **Agent orchestration is siloed.** Paperclip and similar tools orchestrate agents inside one company; they don't model client-facing, portfolio-shaped work with billable teams and mixed human/agent staffing.
- **Templates and routines rot.** Deliverable templates (kickoff deck, weekly status, retro, SoW addendum) live in scattered Drive folders. Nobody knows which template is current.

### 4.2 Opportunity

Give a Growth Unit (or any consulting portfolio owner) **one platform** that:

- Fork-inherits Paperclip's agent orchestration, goal cascading, routines engine, approvals, and audit.
- Adds a Portfolio → Client → Project → (Team) hierarchy.
- Enforces CPS as the default operating model, with roles, rituals, and deliverable templates wired in.
- Lets each project choose its **Story Style** and **SDD Method** — and then reports progress *natively* in that method.
- Provides **pre-built CPS routines** (kickoff, sprint planning, daily standup, sprint review, retrospective, QBR, closeout) as executable workflows, not PDF checklists.
- Runs on **Neon** — serverless Postgres with database branching for dev/preview, and managed auth that branches with the database.

---

## 5. Target Users & Personas

> **Project Clip is an internal tool. Clients never log in.** Client-facing interaction happens through the client's own ticketing tool (Jira, Asana, ADO, Linear, etc.) — see §5.1. All personas below are CI&T-internal.

| Persona | Day-to-day goal | Pain today | What Project Clip gives them |
|---|---|---|---|
| **Growth Unit Lead** | Keep a portfolio of 10–30 projects healthy, hit margin, spot risks early. | Manual rollups, stale status. | Portfolio dashboard with CPS-weighted health, margin, risk signals. |
| **Client Partner** (CI&T-side) | Own the client relationship across multiple projects. | Jumping between 3–5 project tools per client. | Client page: all projects, deliverables, NPS, contract runway. |
| **Project Lead / Delivery Lead** | Run a specific engagement, keep CPS cadence, hit milestones. | Re-building rituals and templates from scratch. | CPS routines preloaded, method-aware progress view. |
| **Architect / Tech Lead** | Keep technical spec and implementation tight. | SDD method chosen ad-hoc, tracking lives in the repo. | Project detail renders phases/gates/artifacts of the selected SDD method. |
| **Agent / AI Teammate** | Execute assigned issues within budget, respect goal lineage. | Needs context about client, CPS phase, deliverable template. | Goal lineage + CPS + template context injected at heartbeat. |
| **Finance / PMO** | Budget compliance, audit trail. | Weekly data-wrangle. | Read-only portfolio export + audit trail, per CPS phase. |

### 5.1 Client interface = the client's ticketing tool

Clients remain on their own tool of record (Jira / Asana / ADO / Linear / etc.). Project Clip is the **CI&T-internal delivery cockpit**; the client-facing touchpoint is a **two-way sync** between Project Clip's internal issues/deliverables and the client's ticketing system.

This is the only place the client sees CI&T's work — so the sync must be loss-less on the things that matter to the client (scope, status, hours, BPC). See §13.3 for the full ticketing-bridge scope; it ships **in Epic 11**, because the CPS/SDD loop has to work internally before client-visible integration is turned on.

---

## 6. Vision & Guiding Principles

1. **Portfolio is a first-class citizen.** Everything — goals, budgets, rituals — cascades from Portfolio → Client → Project → Team.
2. **CPS by default, opt-out-able.** Every new project is CPS-shaped unless the team explicitly chooses a lean variant.
3. **Method-aware, not method-opinionated.** The platform speaks all nine SDD methods; the team picks one per project; progress rendering adapts.
4. **Rituals as executable routines, not PDFs.** A "sprint review" is a scheduled routine (leveraging Paperclip's existing `routines` / `routine_triggers` / `routine_runs` tables) that produces an artifact, not a calendar invite.
5. **Agents and humans are both teammates.** Teams can be mixed; assignment, budgets, and heartbeats work the same way for both.
6. **Inherit Paperclip's safety rails.** Atomic checkout, budget enforcement, approval gates, rollback, multi-tenant isolation — unchanged from upstream.
7. **Boring tech, fast iteration.** Stick to Paperclip's stack (Node 20+ / TypeScript 5.7 / Express 5 / PostgreSQL via Neon / Drizzle ORM / React 19 / Vite 6 / Tailwind CSS v4 / pnpm 9 monorepo) to minimize fork drift.
8. **Extend, don't fork-divert.** Anything that could live upstream (Routine templates API, Deliverables runtime) gets implemented so it's PR-able back to Paperclip.
9. **Release discipline.** Every merge to `main` is a potential release. Conventional Commits drive semantic versioning. Quality gates are automated and non-negotiable.

---

## 7. Core User Stories (MVP)

**As a Growth Unit Lead**, I want to open the portfolio view and see each client and project with a CPS-phase-weighted health score, so I can spot risk in 30 seconds.

**As a Client Partner**, I want a client page that lists all projects, their SDD method, their current CPS phase, and the most recent deliverable, so I can prep for a client QBR in 10 minutes.

**As a Project Lead starting a new engagement**, I want to run `/kickoff` and have the platform create the project, apply the CPS template (Setup phase), seed the recurring routines (sprint planning, standup, review, retro), and ask me for the Story Style and SDD Method — so Day 1 is set up in under 30 minutes.

**As a Project Lead**, I want the project detail page to show progress in *my chosen SDD method* (e.g., BMAD's 4 phases with the Solutioning readiness gate highlighted), not a generic "kanban."

**As an Architect**, I want to attach deliverable templates (architecture doc, ADR, BCP calculation) to the project and have them pre-filled with client context and CPS metadata.

**As an Agent (OpenClaw/Claude Code/etc.)**, I want my heartbeat payload to include: project goal lineage, CPS phase, SDD method, current artifacts, and the allowed deliverable templates, so I can act without re-reading the whole repo.

**As a Finance user**, I want a read-only export of portfolio-level budgets, actuals, and CPS-phase milestones.

**As a Project Lead**, I want the `/weekly-heartbeat` routine to run every Friday and generate a draft status update grounded in the week's commits, issues, and deliverables — so I edit instead of author.

---

## 8. The CPS Framework — How It's Wired In

> Grounded against the CPSBok at `/Users/danielvm/Sites/CPSBok`. **CPS** stands for **CI&T Production System** — CI&T's delivery methodology rooted in Toyota Production System, Lean, Agile, Clean Code, and PMBOK principles.

### 8.1 CPS three-phase lifecycle

| Order | Phase | CPSBok chapters | Duration | Key practices | Gate |
|---|---|---|---|---|---|
| 1 | **Setup** | 04–13 | 1–3 weeks | Develop Vision; Plan Setup; Obtain Client Commitment; Build Correct Teams; Empower Team & Client; PO Coaching; Develop Product Backlog; Model Business Processes; Value Engineering | **Evaluate Inputs Setup** (Ch.13): go / conditional-go / no-go — mandatory deliverables, sign-offs, team capability, technical environment ready |
| 2 | **Production Flow** | 14–30 | Ongoing sprints | Architecture Package; Technical Capacity; Backlog Refinement; Value Governance; Plan Delivery Capacity; Monitoring & Control; Expectations Management; Impediment Management; Ensure Execution of Rituals; Control Quality/Performance; Continuous Improvement; One Piece Flow; Burn Quality In; Continuous Homologation; PO Coaching | **Evaluate Inputs Production Flow** (Ch.30): sprint-level evaluation — DoD, testing health, CI, demo acceptance, roadmap review |
| 3 | **Value Activation** | 31–37 | 1–2 weeks | Plan Production Entry; Impediment Management; Expectations Management; Late Homologation; Support Production Entry; Change Management | **Evaluate Inputs Value Activation** (Ch.37): launch success, value realization vs plan, lessons learned, operational transition |

### 8.2 CPS principles (from CPSBok Ch.2)

1. **Value Focus** — every activity must trace to business value delivery.
2. **Continuous Flow** — minimize batch size, eliminate wait states, one-piece flow.
3. **Quality Built-In** — prevent defects at the source; continuous homologation.
4. **Respect for People** — empower teams, coach POs, build the right teams.
5. **Continuous Improvement** — kaizen cycles, retrospectives, impediment removal.

### 8.3 CPS object model (as encoded in Project Clip)

| CPS concept | Project Clip entity | Mapping |
|---|---|---|
| Portfolio / Practice / Growth Unit | `Portfolio` | **Same row as Paperclip's `companies` table.** Reuses existing multi-tenant isolation, budgets, audit, plugin settings. A `portfolio_profile` side-table holds GU-specific metadata (region, practice, owner). |
| Client / Account | `Client` | **NEW table** under `companies`. Owns contracts, NPS, relationship metadata. Projects FK to `client_id` (new) and keep `company_id` for tenant isolation. |
| Engagement / Project | `Project` | **Existing `projects` table, extended.** Add columns: `client_id`, `framework`, `cps_phase_id`, `sdd_method_id`, `story_style`. |
| Team / Squad | `Team` | **NEW table** under Project. Members are `agents` (existing) and/or `users`. Optional — small projects run without. |
| Roles | `Role` | Extends Paperclip's existing role catalog. CPS roles seeded: **PM, SM/Squad Leader, PO, Dev, QA, Client representative, Architect** (from CPSBok Ch.3 RACI). Mapped to `role_catalog` entries from role-directory. |
| Phases | `Phase` | **NEW table**, per framework. CPS phases seeded: Setup, Production Flow, Value Activation. SDD method phases seeded from Method Adapter. |
| Rituals / Ceremonies | `Routine` | **Existing `routines` table, seeded.** A new `routine_templates` table holds the canonical CPS routine definitions; `/kickoff` instantiates them. |
| Artifacts / Deliverables | `Deliverable` + `DeliverableTemplate` | **NEW.** `deliverable_templates` (global + company-scoped), `deliverables` (per-project instances with rendered outputs). |
| Gates / Checkpoints | `Gate` | **NEW.** Required approvals between phases. Leverages existing `approvals` infrastructure. Maps to CPSBok Ch.13, Ch.30, Ch.37 Evaluate Inputs chapters. |

### 8.4 Normalized role catalog (from `role-directory`)

CPS roles are not invented in this PRD. Project Clip seeds its role catalog from the **internal normalized role directory** at `/Users/danielvm/Sites/role-directory` (`old_docs/data/source_data/roles_catalog_complete.csv` — 47 roles across 7 job families). This gives CI&T a single role vocabulary shared by Project Clip, pricing/finance, and HR.

Three-level taxonomy, straight from the directory: **Job Family → Career Track → Role**.

| Job Family | Career Tracks (count) | Example Roles |
|---|---|---|
| **Data & AI** | Artificial Intelligence, Business Intelligence, Data Analysis, Data Architecture, Data Development, Data Science, Machine Learning | AI Specialist, BI Analyst, Data Analyst, Data Architect, Principal Data Architect, Data Developer, Data Scientist, Machine Learning Specialist |
| **Delivery & Operations** | Customer Success, Management | CX Manager, Customer Service, Project Manager, Program Manager, Team Manager, Executive Manager, Executive Director |
| **Digital Experience** | Content & Communications, Digital Strategy, UI Design, UX Design, UX Research | Copywriter, Digital Strategist, UI Designer, UX Designer, UX Researcher |
| **Immersive Experience** | Gaming & Interactive Media | Immersive Experience Architect, Immersive Experience Developer |
| **Product & Business** | Business Analysis, Product Management | Business Analyst, Product Owner, Product Manager, Product Director |
| **Technology & Development** | Backend, Frontend, Full-Stack, Mobile, Software Dev, Software Architecture, Cloud & Infrastructure, Cybersecurity, Quality Assurance, Technical Support | Backend Developer, Frontend Developer, Full-Stack Developer, Mobile Developer, Developer, Software Architect, Systems Architect, Principal Architect, Cloud Architect, DevOps Specialist, SRE Specialist, Platform Specialist, Cloud Specialist, Security Architect, Info-Security Specialist, Security Ops Analyst, Penetration Tester, QA Analyst, Test Automation Specialist, Support Analyst |

**CPS role slots** (PM, SM, PO, Dev, QA, Client, Architect) are expressed as **required role + level** from the normalized catalog — not free-text. This keeps role assignment consistent across projects and removes naming drift.

**Rule of thumb:** if a role doesn't exist in the role-directory, we don't invent it in Project Clip. We open a PR against `role-directory` first, then consume it.

### 8.5 CPS enforcement, not imposition

- Projects default to CPS (`project.framework = "cps"`), but a `"cps-lite"` or `"none"` escape hatch exists.
- The portfolio dashboard badges non-CPS projects distinctly so leadership can see the ratio of compliant vs. lite engagements.
- CPS phase transitions require a Gate approval (reusing Paperclip's `approvals` + `approval_comments` tables), mapping to CPSBok's Evaluate Inputs chapters.

---

## 9. Pre-built CPS Routines

A **Routine** is a scheduled or triggered workflow — implemented on Paperclip's existing `routines` + `routine_triggers` + `routine_runs` tables — that produces a deliverable and updates project state. Routines are the executable form of CPS rituals.

### 9.1 Routine catalog (MVP)

Grounded against CPSBok Ch.23 (Ensure Execution of Rituals) and the Evaluate Inputs chapters.

| Routine | Trigger | Inputs | Output / Deliverable | CPS phase |
|---|---|---|---|---|
| `/kickoff` | `manual` | Client, SoW summary, Story Style, SDD Method | Project created, CPS template (Setup phase) applied, routines scheduled, kickoff deck draft | Setup |
| `/sprint-planning` | `cron` (sprint start) | Backlog, capacity, sprint goal | Sprint plan, selected backlog items, BCP estimates | Production Flow |
| `/daily-standup` | `cron` (daily) | Team status | Standup notes, impediment flags | Production Flow |
| `/sprint-review` | `cron` (sprint end) | Working software, sprint goal | Review notes, PO acceptance, demo recording link | Production Flow |
| `/retro` | `cron` (sprint end, after review) | Team input form | Retro notes + action items with owners and timelines | Production Flow |
| `/weekly-heartbeat` | `cron` (`FRI 17:00 LOCAL`) | Repo activity, issues, deliverables | Weekly status update, posted to client channel draft | All phases |
| `/phase-gate-review` | `event` (phase transition requested) | Current phase artifacts, Evaluate Inputs checklist | Gate checklist → `approvals` request (go/conditional-go/no-go) | Between phases |
| `/qbr` | `cron` (quarterly) | Project health, margin, NPS | QBR deck draft | Production Flow |
| `/risk-scan` | `cron` (biweekly) | Issues, budget, calendar, open risks | Updated risk register | All phases |
| `/closeout` | `manual` (project end) | Final artifacts, actuals, lessons learned | Closeout report, forward actions, lessons-learned into portfolio KB | Value Activation |

### 9.2 Routine template → instance

Paperclip's existing `routines` table stores live, per-project routine instances. We add:

```
routine_templates           # NEW: canonical CPS routine definitions, ships with the app
  ├── id, slug, title, description
  ├── cps_phase (or "any")
  ├── sdd_method (nullable; method-specific routines)
  ├── default_trigger (kind, cron, timezone)
  ├── prompt_template       # markdown, rendered with project context
  ├── deliverable_template  # FK → deliverable_templates
  ├── required_role         # seeded from CPS roles (e.g., SM owns retro, PO owns review)
  └── version
```

On `/kickoff`, the applicable templates for the project's framework + SDD method are materialized into the existing `routines` table, wired up to `routine_triggers` (cron/event/manual), and executed on Paperclip's scheduler.

### 9.3 Routine authoring

Leads can clone-and-edit a routine in-product (the existing `Routines.tsx` / `RoutineDetail.tsx` pages are extended to show CPS phase + deliverable linkage). The routine-template catalog is versioned per portfolio. Project Clip ships a **CPS canonical set** and an **SDD-method supplement set** (each SDD method can add routines, e.g., BMAD's readiness-gate review).

---

## 10. Deliverable Templates

### 10.1 Template shape

A deliverable template is a Markdown/MDX file with YAML front-matter:

```yaml
---
id: weekly-status
name: Weekly Status Update
cps_phase: any
owner_role: sm
fields:
  - name: highlights
    type: rich-text
  - name: risks
    type: risk-list
  - name: next_week_plan
    type: checklist
renders_to: [docx, md, pptx-slide]
---
```

### 10.2 Seeded template set (MVP)

Grounded against CPSBok Appendix B (Templates & Checklists):

**Setup phase:**
- `project-overview` (MD) — project overview document
- `vision-document` (MD/DOCX) — vision and scope
- `setup-plan-checklist` (MD) — setup completion checklist
- `client-commitment` (MD/DOCX) — client commitment agreement
- `team-building-plan` (MD) — team composition plan
- `epic-mmf-template` (MD) — epic / Minimum Marketable Feature template
- `user-story-template` (MD) — spec-driven user story with AC, Gherkin, BCP
- `product-backlog` (XLSX) — prioritized backlog table
- `bcp-calculation` (XLSX) — BCP estimation table

**Production Flow phase:**
- `architecture-doc` (MD) — architecture document
- `adr` (MD) — architecture decision record
- `sprint-planning` (MD) — sprint plan
- `project-status` (MD/DOCX) — project status report
- `sprint-status` (MD) — sprint status report
- `weekly-status` (MD, PPTX slide) — weekly heartbeat update
- `risk-register` (XLSX) — risk log
- `retro-notes` (MD) — retrospective output

**Value Activation phase:**
- `production-entry-plan` (MD/DOCX) — production entry plan
- `change-management-plan` (MD/DOCX) — change management plan
- `closeout-report` (DOCX) — project closeout
- `lessons-learned` (MD) — indexed into portfolio knowledge base

**Cross-phase checklists (from CPSBok):**
- `code-quality-checklist` (MD) — clean code standards
- `process-compliance-checklist` (MD) — CPS compliance by phase
- `security-checklist` (MD) — security review
- `performance-checklist` (MD) — performance review

### 10.3 Template → renderer

Templates render via the existing docx/pptx/xlsx/pdf skill infrastructure (already present in the host environment — see `skills/` in the Paperclip repo and the system skill set). Project Clip wraps those as internal rendering services (`deliverables.render()`) and attaches the result to the project timeline and existing `documents` / `document_revisions` tables.

---

## 11. Story Style & SDD Method Selection

### 11.1 Story Style (per project)

Story Style = how work items are phrased and sized. Pick one at kickoff; affects issue templates, default definition-of-done, and the work-item form.

Supported styles in MVP:
- **User Story** ("As a ___ I want ___ so that ___") — default, lightweight.
- **Job Story** ("When ___ I want to ___ so I can ___") — JTBD-flavored.
- **BDD / Gherkin** (Given/When/Then) — spec-heavy teams. Aligns with CPSBok's spec-driven user story template.
- **Acceptance-Criteria-first** — short title + AC list only.
- **Hypothesis** ("We believe ___; we'll know when ___") — discovery/experiment work.

### 11.2 SDD Method (per project)

Picked at kickoff from the SDD Academy catalog. v1 supports all nine methods documented by SDD Academy:

| Method | Phases | Team size | Complexity | Notes |
|---|---|---|---|---|
| **BMAD** | Analysis → Planning → Solutioning → Implementation | Large | High | Multi-agent personas, readiness gate. Strong fit for enterprise CPS. |
| **Spec-Kit** | Constitution → Specify → Clarify → Plan → Tasks → Implement | Small–Medium | Medium | Constitution-first; quality-focused. |
| **GSD (Get-Shit-Done)** | Discovery → Discussion → Planning → Execution → Verification → Release | Small–Medium | High | Anti-context-rot; parallel waves. |
| **OpenSpec** | Propose → Review → Apply → Verify → Archive | Small–Medium | Medium | Fluid change folders; brownfield-friendly. |
| **AI-SDD** | Steering → Spec Init → Requirements → Design → Tasks → Implement (TDD) | Small–Medium | High | Director-Executor-Contract; 3 gates. |
| **SpecPulse** | Pulse → Spec → Clarify → Plan → Task → Execute → Validate | Any | Medium | CLI-first; MoSCoW priorities. |
| **Spec Workflow MCP** | Create Spec → Approve Requirements → Approve Design → Execute Tasks | Small–Medium | Low | MCP-native; natural language. |
| **ANWS** | Genesis → Challenge → Blueprint → Forge | Medium–Large | High | Adversarial design review. |
| **Taskmaster** | Write PRD → Parse → Analyze → Expand → Implement | Any | Medium | PRD-to-tasks pipeline. |

### 11.3 Method adapters

Each SDD method is implemented as a **Method Adapter** — a plug-in with:

- A phase definition (ordered list of phase ids, names, gate rules).
- A deliverable set (which templates are required at which phase).
- A progress calculator (maps the project's issue/deliverable state to phase-completion %).
- Optional routines (method-specific, e.g., BMAD's readiness-gate review).
- A renderer (how the phase strip, gate badges, and artifacts appear on the project detail page).
- Option to run CPS raw method, pure CAPS (CI&T Agentic Production System).

Adding method #10 = ship a new adapter package in `packages/method-adapters/*`. No core changes. The interface lives in a package peer to Paperclip's existing `packages/adapters/` (which handles agent adapters). To avoid naming confusion: Paperclip's `adapters` = agent adapters; Project Clip adds `method-adapters` = SDD method adapters.

### 11.4 Project Detail page — method-aware view

The existing `ProjectDetail.tsx` page is extended with three zones:

1. **Header / health** — CPS phase, SDD method badge, Story Style badge, client, team, budget, health score.
2. **Phase strip** — the phases of the project's SDD method, current phase highlighted, gates shown as diamond badges. Click a phase → see artifacts + exit criteria.
3. **Work stream** — issues, deliverables, routines, and recent heartbeats. Filterable by phase. Leverages existing `Issues`, `Approvals`, `ExecutionWorkspace` views.

Progress is computed by the Method Adapter, not by a one-size-fits-all bar.

---

## 12. Data Model (delta from upstream Paperclip)

Additive only; existing Paperclip tables are not renamed.

```
companies                      [EXISTING, reused as Portfolio tenant]
clients                        [NEW: company_id FK, name, relationship metadata, NPS, contract runway]
projects                       [EXISTING, EXTEND with: client_id, framework, cps_phase_id,
                                sdd_method_id, story_style]
teams                          [NEW: project_id FK, name, description]
team_members                   [NEW: team_id, agent_id|user_id, role]
phases                         [NEW: framework | sdd_method scoped; name, order, exit_criteria]
gates                          [NEW: from_phase_id, to_phase_id, required_role, requires_approval]
routine_templates              [NEW: canonical CPS/method routine definitions]
routines                       [EXISTING, reused; instantiated from routine_templates at kickoff]
routine_triggers, routine_runs [EXISTING, reused]
deliverable_templates          [NEW: id, slug, format, fields schema, renderer config]
deliverables                   [NEW: project_id, template_id, status, rendered_doc_id → documents.id]
role_catalog                   [NEW: job_family, career_track, role, role_description;
                                seeded from /role-directory/old_docs/data/source_data/roles_catalog_complete.csv]
role_prices                    [NEW (optional): region, role, hourly_rate; seeded from global_prices.csv]
agents.role_id                 [NEW column on existing agents → role_catalog.id (replaces free-text agent.role)]
team_members.role_id           [NEW column on team_members → role_catalog.id]
method_adapters (in-code)      [registry, not a DB table]
story_styles (in-code)         [enum + form schema]
ticketing_links                [NEW (Epic 11): project_id, system, external_id, last_synced_at, mapping]
ticketing_field_maps           [NEW (Epic 11): per-project mapping of internal fields ↔ client tool fields]
ticketing_sync_log             [NEW (Epic 11): direction, payload_hash, status, error]
```

**Auth tables (Neon Auth):** After Epic 2, authentication data lives in the `neon_auth` schema managed by Neon. The existing Drizzle schema references (`user`, `session`, `account`, `verification` in `packages/db/src/schema/auth.ts`) are updated to reference the `neon_auth` schema.

Budgets (`budgets`, `budget_policies`, `budget_incidents`), goals (`goals`, `project_goals`), issues (`issues`, `issue_*`), approvals (`approvals`, `approval_comments`), heartbeats (`heartbeat_runs`, `heartbeat_run_events`), documents (`documents`, `document_revisions`), cost/finance (`cost_events`, `finance_events`) — **all reused unchanged**.

Migrations ship via Paperclip's existing Drizzle + `migrate.ts` pipeline (see `packages/db/src/migrations/`).

---

## 13. Architecture

### 13.1 Stack

| Layer | Technology | Notes |
|---|---|---|
| Runtime | Node 20+ | Paperclip CI uses Node 24; Dockerfile uses `node:lts-trixie-slim` |
| Language | TypeScript ~5.7 | `strict: true`, `NodeNext` modules, `ES2023` target |
| Package manager | pnpm 9 | Monorepo workspaces |
| Server | Express 5 | With pino logging, ws for realtime |
| Database | **Neon Database** (serverless Postgres) | Replaces embedded/local Postgres after Epic 3. Drizzle ORM ^0.38 unchanged. Branching for dev/preview. |
| Auth | **Neon Auth** (managed Better Auth 1.4.18) | Replaces self-hosted Better Auth after Epic 2. Auth data in `neon_auth` schema. Branch-aware. |
| UI | React 19, Vite 6, Tailwind CSS v4 | React Router 7, TanStack Query, Radix, Lexical |
| Testing | Vitest 3 (unit/integration), Playwright (e2e) | Workspace-scoped Vitest projects |
| CI/CD | GitHub Actions + semantic-release | Typecheck → test → build → e2e → release |
| Container | Docker (multi-stage) | For deployment; dev uses Neon directly |

### 13.2 New packages

```
packages/
  portfolio-core/           # Portfolio profile, Client, Team models + services
  cps-framework/            # CPS phase lib, roles, routine_templates, deliverable_templates
  role-catalog/             # role_catalog seeder + sync from /role-directory
  method-adapters/
    bmad/
    spec-kit/
    taskmaster/
    caps/                   # CI&T Agentic Production System (CPS-derived)
    # v1.1+: gsd, openspec, ai-sdd, specpulse, spec-workflow-mcp, anws
  deliverables/             # Template runtime + renderers (wraps docx/pptx/xlsx/pdf skills)
  routines-cps/             # CPS routine pack (templates, prompts)
  ticketing-adapters/       # Epic 11: client-tool bridges (jira, asana, ado, linear)
```

UI additions live in `ui/src/pages/` alongside existing pages:
- `Portfolio.tsx` (new)
- `Clients.tsx`, `ClientDetail.tsx` (new)
- `ProjectDetail.tsx` (extended with phase strip, method adapter renderer)
- `Projects.tsx` (filters for CPS phase, SDD method, client)
- `Teams.tsx`, `TeamDetail.tsx` (new)
- `DeliverableTemplates.tsx`, `DeliverableDetail.tsx` (new)

Server additions in `server/src/`:
- `services/portfolio.ts`, `services/clients.ts`, `services/teams.ts`, `services/deliverables.ts`, `services/method-adapters.ts`, `services/phases.ts`, `services/gates.ts`
- `routes/portfolio.ts`, `routes/clients.ts`, `routes/teams.ts`, `routes/deliverables.ts`, `routes/phases.ts`
- `services/routines.ts` is extended (not replaced) to materialize from templates.

### 13.3 Ticketing bridge (Epic 11; target v1.7.0+)

Clients don't log into Project Clip. They see CI&T's work through their own ticketing tool. Project Clip therefore ships a **Ticketing Bridge** — a two-way sync between Project Clip's internal work items and the client's system.

**Supported systems (in priority order):** Jira → Asana → Azure DevOps (ADO) → Linear. One adapter per system, under `packages/ticketing-adapters/*`.

**Scope of the bridge (per project):**

| Capability | Direction | Detail |
|---|---|---|
| Create features / epics / stories in client tool from a Project Clip deliverable or issue | Project Clip → Client tool | Trigger: manual ("Publish to Jira") and automatic on CPS phase entry (configurable per project). Maps Story Style → issue type. |
| Update ticket details (title, description, AC, status, labels, assignee, links) | bidirectional | Writes go through a diff + approval when the update changes client-visible fields. |
| **Hours logged** | bidirectional | Map Project Clip's worklog entries to the client tool's time-tracking (e.g., Tempo on Jira). Single source of truth per project (CI&T-internal vs. client) is configurable. |
| **BPC (Business Point Count) / story points / T-shirt sizes** | bidirectional | Map Project Clip's estimate field to the client's sizing field. BPC is CI&T's canonical; client-side is derived when they use a different unit. |
| Comments and attachments | bidirectional | Threaded; redaction rules per project (see §13.3.2). |
| Sprints / iterations / boards | read from client, write Project Clip status back | Project Clip mirrors the client's iteration cadence when the client owns the board. |
| Webhooks for status change on client side | Client tool → Project Clip | Updates Project Clip's issue + fires CPS routines (e.g., /weekly-heartbeat pulls from the bridge). |

**§13.3.1 — Routine hooks**

CPS routines (§9) are client-aware:
- `/kickoff` creates the parent epic(s) in the client tool.
- `/sprint-planning` syncs the sprint scope to the client board.
- `/weekly-heartbeat` pulls the week's activity from the client tool to ground the status update.
- `/phase-gate-review` blocks if the corresponding client-side epic is not in the agreed state.

**§13.3.2 — Safety, privacy, redaction**

The bridge is the only surface where CI&T-internal data can cross into client tenancy. Hard rules:
- All writes to the client tool require a per-project allow-list of fields; comments and attachments default to off and must be turned on per project.
- A redaction pass (reusing Paperclip's `feedback-redaction`, `redaction.ts`, `log-redaction.ts`) scrubs internal labels, PII, and budget/cost fields before any outbound write.
- Approvals (Paperclip `approvals` table) gate the first outbound sync of each project; subsequent writes inherit that approval.
- The bridge runs inside Paperclip's plugin runtime sandbox (`plugin-runtime-sandbox.ts`), so credentials for client tools never leak into the core server.

**§13.3.3 — Non-goals for the bridge**
- No auto-close of client tickets from CI&T side.
- No bulk migration (Project Clip ↔ client tool); the bridge is per-project and incremental.
- No billing push (invoicing still lives in Portfolio Management Cockpit).

### 13.4 Extension points

- **Method Adapter API** — `registerMethodAdapter({ id, phases, deliverables, progressFn, routines, renderer })`.
- **Routine template DSL** — YAML front-matter + prompt template, executed on Paperclip's existing routine scheduler.
- **Deliverable template renderer** — pluggable per output format (docx/pptx/xlsx/pdf/md).
- **Story Style form schema** — declarative, hot-swappable.
- **Framework interface** — CPS is one implementation of an abstract `Framework` (id, phases, roles, routines, templates); future frameworks ship as new framework packages.

### 13.5 Fork strategy

- Cloned from `/Users/danielvm/Sites/paperclip` — use this version as the upstream reference.
- `FORK_DIFF.md` maintained from Epic 0 onward, documenting every structural divergence.
- Quarterly sync branch to reconcile upstream changes.

---

## 14. Success Metrics

| Metric | Baseline | v1.0 target | v1.7+ target |
|---|---|---|---|
| Time to kick off a new CPS project | ~2–4 hours | ≤ 30 min | ≤ 15 min |
| % of active projects with a current weekly status | 40–60% (estimate) | ≥ 90% | ≥ 98% |
| % of projects using a declared SDD method | <20% (ad-hoc) | ≥ 70% | ≥ 90% |
| GU Lead time-to-signal on a red project | days | same day | < 2 hours |
| Deliverable template reuse rate | low (copy-paste) | ≥ 80% of deliverables from templates | ≥ 95% |
| Fork drift from upstream Paperclip | n/a | rebase passes each quarter with < 200 LOC conflicts | < 50 LOC |
| Release cadence | n/a | ≥ 1 release per sprint (semantic-release automated) | continuous |
| Quality gate pass rate | n/a | 100% of releases pass all 5 gates (§2.5) | 100% |

---

## 15. Risks & Mitigations

| Risk | Severity | Mitigation | Epic affected |
|---|---|---|---|
| Upstream Paperclip changes shape and fork drifts. | High | Quarterly sync branch; minimize upstream edits; contribute Framework API + Routine Template DSL back. | All |
| Neon Auth beta limitations block required auth features. | Medium | Neon Auth wraps Better Auth 1.4.18 (same version Paperclip uses). If a gap exists, fall back to self-hosted Better Auth temporarily. | Epic 2 |
| Neon DB connection pooling or cold-start latency in dev. | Medium | Use Neon's connection pooler; warm branches on PR creation; benchmark before committing. | Epic 3 |
| Nine SDD methods is too many to maintain. | Medium | Ship 4 in v1.0 (BMAD, Spec-Kit, Taskmaster, CAPS); each added method lives in a separate package; deprecate low-usage ones. | Epic 6, 10 |
| Teams resist "another tool." | Medium | Pilot first with 1 GU; Paperclip's UX is familiar; strictly additive; read-only integrations, never forced migrations. | Epic 8 |
| Agents need too much context to run routines, heartbeats blow budgets. | Medium | Use Paperclip's persistent state + runtime skill injection; templates are context-dense but compact; inherit existing `budget_policies` and `budget_incidents`. | Epic 7 |
| Method Adapter API becomes leaky and needs constant refactor. | Medium | Freeze the API after Epic 6; version it; treat breaking changes as semver-major. | Epic 6 |
| Schema changes to `projects` break existing Paperclip tests. | Medium | All new columns nullable; feature-flag the CPS layer for upstream parity tests. | Epic 4 |
| Security: multi-tenant isolation bug leaks client data across portfolios. | Critical | Inherit Paperclip's multi-tenant tests; add portfolio-level audit + DPA review in Epic 8. | All |
| Outbound writes leak CI&T-internal data into client tenancy. | Critical | Per-project allow-list + redaction pass + first-write approval (§13.3.2). | Epic 11 |
| Two-way sync creates loops or stale conflicts. | High | Idempotency keys, conflict policy per field, single source of truth declared per project. | Epic 11 |

---

## 16. Open Questions

| # | Question | Status | Resolution |
|---|---|---|---|
| 1 | **CPS phase set.** What are the canonical CPS phases? | **Resolved.** Setup → Production Flow → Value Activation (CPSBok). |
| 2 | **CPS full name.** What does CPS stand for? | **Resolved.** CI&T Production System. |
| 3 | **CPS role catalog.** Which CPS roles are mandatory vs. optional per engagement size? | Partially resolved. CPSBok Ch.3 RACI defines PM, SM, PO, Dev, QA, Client, Architect. Need engagement-size thresholds. |
| 4 | **Client data model.** Do we need Contacts/Contracts/NPS from Day 1, or is a minimal Client sufficient? | Open. |
| 5 | **Billing.** Does Project Clip need to know hours/rates, or do we always defer to the Portfolio Management Cockpit? | Open. |
| 6 | **Framework ownership.** Who approves changes to CPS phases, roles, templates? | Open. Suggest: CPSBok maintainer (Daniel) + a small steering group. |
| 7 | **Which GU pilots first?** | Open. Recommend the GU with the most familiarity, to minimize ramp friction. |
| 8 | **Naming.** "Project Clip" is the working project name. Final product name TBD. | Open. |
| 9 | **Licensing.** Paperclip's LICENSE needs confirmation; Project Clip inherits it; internal fork stays private until Legal review. | Open. |
| 10 | **Portfolio as Company.** Confirm mapping — should Portfolio literally be the `companies` row, or a side-table? | Open. Current PRD: reuse `companies` to minimize fork drift. |
| 11 | **Source of truth for hours and BPC.** When the client uses Jira-Tempo or ADO time tracking, is Project Clip the source of truth, or the client tool? | Open. Default per project, or org-wide policy? |
| 12 | **Role-directory sync model.** Pull-on-deploy from the CSV, or live integration with the role-directory API once it ships? | Open. Current PRD: seed-on-deploy. |
| 13 | **Neon plan tier.** Free tier supports 60K MAU; Launch/Scale supports 1M MAU. Which tier for pilot? | Open. Free tier likely sufficient for internal pilot. |
| 14 | **Neon region.** Neon Auth requires AWS region. Which region for CI&T? | Open. |

---

## 17. Appendix A — CPS Reconciliation Checklist

> Grounded against CPSBok at `/Users/danielvm/Sites/CPSBok`. Items marked ✅ are confirmed; items marked ⬜ need final sign-off.

- [x] Confirm phase names, order, and exit criteria. → **Setup, Production Flow, Value Activation** with Evaluate Inputs gates (Ch.13, Ch.30, Ch.37).
- [x] Confirm CPS full name. → **CI&T Production System**.
- [x] Confirm CPS principles. → Value Focus, Continuous Flow, Quality Built-In, Respect for People, Continuous Improvement.
- [x] Confirm ritual set. → Sprint Planning, Daily Standup, Sprint Review, Sprint Retrospective (Ch.23).
- [x] Confirm template catalog. → Grounded against CPSBok Appendix B (Templates & Checklists).
- [ ] Confirm full role list and mandatory vs. optional per engagement size (Ch.3 RACI provides the base; need size thresholds).
- [ ] Confirm health-score formula (CPS-weighted).
- [ ] Confirm terminology (Portfolio vs. Growth Unit vs. Practice).
- [ ] Confirm governance / approval gate details (Evaluate Inputs checklist items to encode as structured data).

## 17b. Risks update (ticketing bridge)

| Risk | Severity | Mitigation |
|---|---|---|
| Outbound writes leak CI&T-internal data into client tenancy. | Critical | Per-project allow-list + redaction pass + first-write approval (§13.3.2). |
| Two-way sync creates loops or stale conflicts. | High | Idempotency keys, conflict policy per field, single source of truth declared per project. |
| Hours/BPC unit mismatch causes invoicing disputes. | High | BPC/units mapping signed off at kickoff; visible diff before any outbound update. |
| Client API rate limits or auth changes break the bridge. | Medium | Adapter pattern + circuit-breaker; bridge runs in plugin sandbox, failures don't take down the core. |

---

## 18. Appendix B — Glossary

- **Portfolio** — the top-level tenant; one Growth Unit or practice. Maps to Paperclip's existing `companies` row.
- **Client** — an account the portfolio serves.
- **Project** — an engagement with a client; has a CPS phase, SDD method, story style.
- **Team** — a group of agents and/or humans assigned to a project.
- **CPS** — the **CI&T Production System** Body of Knowledge; CI&T's delivery methodology rooted in Toyota Production System / Lean principles. Three phases: Setup → Production Flow → Value Activation.
- **SDD Method** — a spec-driven development method (BMAD, Spec-Kit, etc.) selected per project.
- **CAPS** — CI&T Agentic Production System; a CPS-derived method for fully agentic workflows.
- **Story Style** — the shape of a work item (user story, job story, BDD, etc.).
- **Routine** — a scheduled/triggered workflow; the executable form of a CPS ritual. Instantiated from a `routine_template` into Paperclip's existing `routines` table.
- **Deliverable Template** — a renderable template (MD/DOCX/PPTX/XLSX) pre-wired to CPS metadata.
- **Method Adapter** — a plug-in that teaches Project Clip how a given SDD method works.
- **Gate** — an approval checkpoint between two phases, wired to Paperclip's `approvals`. Maps to CPSBok's "Evaluate Inputs" chapters.
- **Role Catalog** — the normalized 3-level role taxonomy (Job Family → Career Track → Role) seeded from `/role-directory`. Used for every role assignment in Project Clip.
- **BPC** — Business Point Count; CI&T's canonical sizing unit mapped to client-side story points or T-shirt sizes via the Ticketing Bridge.
- **Ticketing Bridge** — the Epic 11 two-way sync between Project Clip and a client's ticketing tool (Jira / Asana / ADO / Linear). The only client-visible surface of Project Clip.
- **Neon Auth** — Neon's managed authentication service built on Better Auth 1.4.18. Stores users, sessions, and auth config in the Neon database. Branch-aware.
- **Neon Database** — Neon's serverless Postgres platform with autoscaling, branching, and instant restore.
- **Semantic Release** — Automated version management driven by Conventional Commits. Determines version bumps from commit messages.
- **Conventional Commits** — A commit message convention (`type(scope): description`) that enables automated versioning and changelog generation.

---

## 19. Appendix C — Paperclip Tables Reused (read-only reference)

`companies`, `company_memberships`, `company_secrets`, `agents`, `agent_*`, `goals`, `project_goals`, `project_workspaces`, `issues`, `issue_*`, `approvals`, `approval_comments`, `routines`, `routine_triggers`, `routine_runs`, `heartbeat_runs`, `heartbeat_run_events`, `documents`, `document_revisions`, `budgets`, `budget_policies`, `budget_incidents`, `cost_events`, `finance_events`, `execution_workspaces`, `activity_log`, `plugins`, `plugin_*`, `instance_settings`.

Auth tables (`user`, `session`, `account`, `verification`) migrate to `neon_auth` schema in Epic 2.

---

## 20. Appendix D — Consistency Fixes from Original PRD

This section documents inconsistencies found in the original `paperclip-cps-prd.md` (Draft v0.3) and how they are resolved in this edition.

| # | Issue | Location | Resolution |
|---|---|---|---|
| 1 | **CPS full name inconsistency.** Constitution says "Consulting Production System"; Appendix B glossary says "Consulting Project System"; neither is correct. | Constitution §II, PRD §18 | **Fixed.** CPS = **CI&T Production System** throughout. Constitution needs a patch. |
| 2 | **CPS phases were placeholders.** `Discover → Define → Deliver → Sustain` marked `[CPS-TBD]`. | PRD §6.1 | **Fixed.** Real CPSBok phases: **Setup → Production Flow → Value Activation**. |
| 3 | **CPS roles were placeholders.** Listed as "Client Partner, Delivery Lead, Architect, Scrum Master, UX Lead, QA Lead, Agent Operator" marked `[CPS-TBD]`. | PRD §6.1 | **Fixed.** Real CPSBok RACI roles: **PM, SM/Squad Leader, PO, Dev, QA, Client, Architect**. |
| 4 | **Neon Auth/DB mentioned inline but not structured as epics.** §12 referenced them as first/second tasks without release mapping. | PRD §12 | **Fixed.** Epic 2 (v0.0.3) = Neon Auth; Epic 3 (v0.0.4) = Neon Database. |
| 5 | **No release strategy.** §12 mentioned semantic release but provided no branch strategy, version scheme, or quality gates. | PRD §12 | **Fixed.** Full §2 Release Strategy with branch model, toolchain, and gates. |
| 6 | **Milestones not aligned to releases.** §14 listed M0–M7 without version tags. | PRD §14 | **Fixed.** §3 Epic-Release Map with explicit version per epic. |
| 7 | **Tech stack was generic.** §11.1 said "Node/TS, Postgres + Drizzle, React, pnpm monorepo" without versions. | PRD §11.1 | **Fixed.** §13.1 lists exact versions: Node 20+, TS 5.7, Express 5, React 19, Vite 6, Tailwind v4, pnpm 9, Drizzle 0.38. |
| 8 | **CAPS undefined.** §9.3 referenced "CAPS (CI&T Agentic Production System)" without definition. | PRD §9.3 | **Fixed.** Defined in §18 glossary and included as a method adapter in Epic 6. |
| 9 | **Section numbering drift.** Ticketing bridge was §12.3 (inside MVP scope); should be its own section. | PRD §12.3 | **Fixed.** Ticketing bridge is §13.3 in its own architecture subsection, mapped to Epic 11. |
| 10 | **Better Auth version alignment.** PRD didn't note that Paperclip uses the same Better Auth version (1.4.18) as Neon Auth. | Not documented | **Fixed.** §1, §3 (Epic 2), and §13.1 note the shared version, validating a natural migration path. |

---

*"Clean code always looks like it was written by someone who cares." — This PRD was written with the same discipline.*

*End of brief v1.0. Next steps: (1) patch the constitution to fix the CPS full name, (2) confirm open questions §16, (3) begin Epic 0.*
