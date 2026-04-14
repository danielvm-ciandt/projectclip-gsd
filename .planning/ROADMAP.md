# Roadmap: Project Clip

## Overview

**Current GSD milestone:** 🚧 **v0.1.0 Foundation** — active program through **Epics 0–3** (roadmap Phases 1–4: fork, Neon Auth, Neon Database, rebrand). This is the planning bucket in **STATE.md** and `/gsd-*` tools. **v1.0.0** below is **MVP GA** (Phase 10), not the current milestone. *(The Epic 4 / portfolio line references a **product release** label `v0.1.0`; that is separate from this foundation milestone name.)*

Deliver **Project Clip** as a Paperclip fork that migrates to **Neon Auth + Neon Database**, rebrands, then layers **portfolio hierarchy**, the **CPS** operating model, **SDD method adapters**, and **portfolio health / routine execution** — culminating in a **pilot** and **v1.0.0 GA**. Phases follow PRD **Epics 0–9** (sequential releases). Post-GA work (remaining adapters, ticketing bridge) lives in **REQUIREMENTS.md** v2.

**Mapping:** PRD Epic *N* → Roadmap Phase *N+1* (Epic 0 = Phase 1).

## Phases

- [ ] **Phase 1: Fork & platform baseline** — Runnable Paperclip fork, CI, semantic-release, quality gates (PRD Epic 0 / `v0.0.1`).
- [ ] **Phase 2: Neon Auth** — Managed auth; sessions power app and downstream features (Epic 1).
- [ ] **Phase 3: Neon Database** — Serverless Postgres; migrations; branching workflow (Epic 2).
- [ ] **Phase 4: Rebrand** — `@projectclip/*`, CLI, zero stray Paperclip branding (Epic 3).
- [ ] **Phase 5: Portfolio hierarchy** — Clients, teams, extended projects, role catalog (Epic 4 / `v0.1.0`).
- [ ] **Phase 6: CPS framework** — Phases, gates, routine + deliverable templates, kickoff materialization (Epic 5).
- [ ] **Phase 7: SDD method adapters** — API + BMAD, Spec-Kit, Taskmaster, CAPS; ProjectDetail method UI (Epic 6).
- [ ] **Phase 8: Portfolio dashboard & execution** — Health rollup, routine → deliverable → MD/DOCX, heartbeat (Epic 7).
- [ ] **Phase 9: Pilot** — One GU, metrics, P0 clearance (Epic 8).
- [ ] **Phase 10: MVP GA** — Docs, second GU, ops, security, **v1.0.0** (Epic 9).

---

## Phase Details

### Phase 1: Fork & platform baseline

**Goal:** Copy Paperclip into the Project Clip repo; all quality gates green; release tooling ready.  
**Depends on:** Nothing (first phase).  
**PRD reference:** Epic 0 — `v0.0.1`.  
**Requirements:** BOOT-01..BOOT-07, QUAL-01, QUAL-02.  
**UI hint:** no  

**Success criteria** (what must be TRUE):

1. A fresh clone installs and runs checks without manual patching.
2. Typecheck, unit tests, build, and e2e (where applicable) pass in CI.
3. semantic-release configuration is valid for the release pipeline.

**Plans:** 4 plans (`01-01` … `01-04`)

Plans:

- [ ] `01-01-PLAN.md` — Import Paperclip tree (D-01), `FORK_DIFF.md` stub, `[BLOCKING] pnpm db:migrate` (BOOT-01, BOOT-07)
- [ ] `01-02-PLAN.md` — Green typecheck / Vitest / build / e2e (D-02, D-04), `[BLOCKING] pnpm db:migrate` if schema touched (BOOT-02..BOOT-05)
- [ ] `01-03-PLAN.md` — Port GitHub Actions to `main`, QUAL-01 alignment, document CI deltas (D-03, D-04, QUAL-01, BOOT-07)
- [ ] `01-04-PLAN.md` — semantic-release + angular preset, `main` push dry-run CI, `release.sh` coexistence in FORK_DIFF (BOOT-06, BOOT-07, QUAL-02, D-06, D-07)

---

### Phase 2: Neon Auth

**Goal:** Replace self-hosted Better Auth with **Neon Auth**; login works; sessions stable for API and agents.  
**Depends on:** Phase 1.  
**PRD reference:** Epic 1.  
**Requirements:** AUTH-01..AUTH-05, QUAL-01.  
**UI hint:** yes  

**Success criteria:**

1. User can sign in through Neon Auth and remain signed in across refresh.
2. Protected APIs resolve the current user/session consistently.
3. Previously working auth-dependent features (agents, tokens) remain functional.

**Plans:** TBD.

---

### Phase 3: Neon Database

**Goal:** Run all data on **Neon**; migrations clean; embedded/local Postgres path removed; branching for dev/CI.  
**Depends on:** Phase 2.  
**PRD reference:** Epic 2.  
**Requirements:** DATA-01..DATA-05, QUAL-01.  
**UI hint:** no  

**Success criteria:**

1. Application boots against Neon with secure connections.
2. Full migration set applies to a fresh Neon database.
3. Documented workflow uses Neon branches for preview/dev as specified.

**Plans:** TBD.

---

### Phase 4: Rebrand to Project Clip

**Goal:** **Project Clip** identity — packages, CLI, env prefixes, UI shell, Docker names per scope.  
**Depends on:** Phase 3.  
**PRD reference:** Epic 3.  
**Requirements:** BRND-01..BRND-04, QUAL-01, QUAL-02.  
**UI hint:** yes  

**Success criteria:**

1. Workspace packages and CLI match rebranding rules.
2. No disallowed `paperclip` references in source (exceptions documented).
3. Running app presents Project Clip branding.

**Plans:** TBD.

---

### Phase 5: Portfolio hierarchy & roles

**Goal:** **Portfolio → Client → Project → Team** with **role_catalog** seeded from role-directory; tenant-safe CRUD.  
**Depends on:** Phase 4.  
**PRD reference:** Epic 4 — `v0.1.0`.  
**Requirements:** PORT-01..PORT-07, QUAL-01.  
**UI hint:** yes  

**Success criteria:**

1. User can manage clients and teams and navigate the hierarchy end-to-end.
2. Projects expose framework/CPS/SDD/story fields and filters as specified.
3. Role catalog is populated from the canonical CSV and used for assignments.
4. Tests cover tenant isolation for new entities.

**Plans:** TBD.

---

### Phase 6: CPS framework

**Goal:** Encode **CPS** lifecycle (three phases, gates), **routine templates**, **deliverable templates**, kickoff materialization, gate approvals.  
**Depends on:** Phase 5.  
**PRD reference:** Epic 5.  
**Requirements:** CPS-01..CPS-05, QUAL-01.  
**UI hint:** yes  

**Success criteria:**

1. New projects default to CPS; phases and gates appear on project detail.
2. Kickoff creates routine instances from templates with triggers.
3. Gate transitions require approvals before proceeding.

**Plans:** TBD.

---

### Phase 7: SDD method adapters

**Goal:** **Method Adapter API** plus **BMAD**, **Spec-Kit**, **Taskmaster**, **CAPS**; **ProjectDetail** shows method-native progress.  
**Depends on:** Phase 6.  
**PRD reference:** Epic 6.  
**Requirements:** METH-01..METH-07, QUAL-01.  
**UI hint:** yes  

**Success criteria:**

1. Adapters register phases, progress, and UI without core code forks per method.
2. User selects Story Style and SDD method at kickoff/creation.
3. Project detail shows phase strip, gates, and adapter-driven progress.

**Plans:** TBD.

---

### Phase 8: Portfolio dashboard & routine execution

**Goal:** **Portfolio** health rollup; **routines** produce **deliverables**; **MD/DOCX** rendering; **weekly heartbeat** draft.  
**Depends on:** Phase 7.  
**PRD reference:** Epic 7.  
**Requirements:** DASH-01..DASH-05, QUAL-01.  
**UI hint:** yes  

**Success criteria:**

1. Portfolio view exposes per-client/project health signals (score may iterate).
2. Scheduled/triggered routines create deliverables attached to the project.
3. Deliverables render to Markdown and DOCX on the timeline.
4. Weekly heartbeat produces an editable draft status.

**Plans:** TBD.

---

### Phase 9: Pilot

**Goal:** Validate with **one Growth Unit** (~10 projects); hit adoption and NPS targets; **zero P0**.  
**Depends on:** Phase 8.  
**PRD reference:** Epic 8.  
**Requirements:** PLT-01..PLT-04, QUAL-01.  
**UI hint:** no  

**Success criteria:**

1. Pilot GU runs real engagements in Project Clip for the agreed window.
2. NPS ≥ 8/10 and adoption ≥ 70% per measurement plan.
3. No open P0 bugs at exit.

**Plans:** TBD.

---

### Phase 10: MVP GA

**Goal:** **v1.0.0** — documentation, second GU, monitoring, security sign-off, SLA.  
**Depends on:** Phase 9.  
**PRD reference:** Epic 9.  
**Requirements:** GA-01..GA-05, QUAL-01.  
**UI hint:** no  

**Success criteria:**

1. Published docs and onboarding cover v1 capabilities.
2. Second GU successfully onboarded.
3. Monitoring/alerting and security audit complete; **v1.0.0** tagged.

**Plans:** TBD.

---

## Progress

**Execution order:** 1 → 2 → 3 → … → 10 (insert decimal phases only if urgent gaps appear).

| Phase | Name | Plans complete | Status | Completed |
|-------|------|----------------|--------|-----------|
| 1 | Fork & platform baseline | 0/4 | Not started | — |
| 2 | Neon Auth | 0/TBD | Not started | — |
| 3 | Neon Database | 0/TBD | Not started | — |
| 4 | Rebrand | 0/TBD | Not started | — |
| 5 | Portfolio hierarchy | 0/TBD | Not started | — |
| 6 | CPS framework | 0/TBD | Not started | — |
| 7 | SDD method adapters | 0/TBD | Not started | — |
| 8 | Dashboard & execution | 0/TBD | Not started | — |
| 9 | Pilot | 0/TBD | Not started | — |
| 10 | MVP GA | 0/TBD | Not started | — |

---

## Requirement coverage

| Phase | Requirement IDs |
|-------|-------------------|
| 1 | BOOT-01..07, QUAL-01, QUAL-02 |
| 2 | AUTH-01..05, QUAL-01 |
| 3 | DATA-01..05, QUAL-01 |
| 4 | BRND-01..04, QUAL-01, QUAL-02 |
| 5 | PORT-01..07, QUAL-01 |
| 6 | CPS-01..05, QUAL-01 |
| 7 | METH-01..07, QUAL-01 |
| 8 | DASH-01..05, QUAL-01 |
| 9 | PLT-01..04, QUAL-01 |
| 10 | GA-01..05, QUAL-01 |

---

*Roadmap created: 2026-04-13*  
*Aligned with: `projectclip-prd.md` Epics 0–9, `.planning/research/SUMMARY.md`*
