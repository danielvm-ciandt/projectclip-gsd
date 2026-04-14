# Requirements: Project Clip

**Defined:** 2026-04-13  
**Sources:** `projectclip-prd.md`, `.planning/PROJECT.md`, `.planning/research/SUMMARY.md`  
**Core value:** A Growth Unit lead can open one screen and see every client engagement's CPS-phase health, risk signals, and method-aware progress — without spreadsheets, status calls, or tribal knowledge.

## v1 Requirements

Requirements for MVP through **v1.0.0 GA** (Phases 1–10 on the roadmap). Each item maps to exactly one roadmap phase in the Traceability section.

### Release engineering & quality (cross-cutting)

Quality gates from PRD §2.5 apply to **every** merge/release unless noted.

- [ ] **QUAL-01**: CI runs `pnpm install --frozen-lockfile`, `pnpm -r typecheck`, `pnpm test:run`, `pnpm build`, and `pnpm test:e2e` (when applicable) before release automation proceeds.
- [ ] **QUAL-02**: Versioning follows Conventional Commits + semantic-release (angular preset); Epics 0–3 use `fix` for bootstrapping per PRD §2.2 where applicable.

### Phase A — Fork & bootstrap (Epic 0)

- [ ] **BOOT-01**: Repository contains a complete Paperclip fork; `pnpm install` succeeds on a clean checkout.
- [ ] **BOOT-02**: `pnpm -r typecheck` passes across all workspace packages.
- [ ] **BOOT-03**: `pnpm test:run` (Vitest) passes across workspace projects.
- [ ] **BOOT-04**: `pnpm build` produces a successful production build.
- [ ] **BOOT-05**: `pnpm test:e2e` passes when e2e is in scope for the release.
- [ ] **BOOT-06**: semantic-release is configured (e.g. `.releaserc`); CI can validate release pipeline (dry-run or equivalent).
- [ ] **BOOT-07**: `FORK_DIFF.md` exists and is updated when structural divergence from upstream is introduced.

### Neon Auth (Epic 1)

- [ ] **AUTH-01**: User can authenticate via Neon Auth (email/password and/or OAuth as configured for the environment).
- [ ] **AUTH-02**: Session is established and persists across browser refresh for the SPA.
- [ ] **AUTH-03**: Server middleware resolves the current user/session for protected API routes using Neon Auth.
- [ ] **AUTH-04**: Existing auth-dependent capabilities still work (e.g. agent authentication, API tokens — per upstream behavior documented in fork notes).
- [ ] **AUTH-05**: Auth-related data follows the Neon Auth / `neon_auth` schema strategy described in PROJECT.md (Drizzle references updated accordingly).

### Neon Database (Epic 2)

- [ ] **DATA-01**: Application connects to Neon Database using a secure connection string (`sslmode=require` or equivalent).
- [ ] **DATA-02**: All existing Drizzle migrations apply cleanly to Neon for a fresh database.
- [ ] **DATA-03**: Automated tests execute against Neon (or a Neon branch) per the agreed CI strategy.
- [ ] **DATA-04**: Embedded/local PostgreSQL is removed from the development and dependency path as specified in the PRD (no regression in developer workflow).
- [ ] **DATA-05**: Database branching workflow is usable for dev/preview (create/attach branch; run migrations).

### Rebrand (Epic 3)

- [ ] **BRND-01**: Package names and workspace scopes reflect **Project Clip** (`@projectclip/*` per PRD).
- [ ] **BRND-02**: CLI binary/name responds as **`projectclip`** (per PRD).
- [ ] **BRND-03**: Source tree contains **no** `paperclip` string except where explicitly allowed (e.g. `FORK_DIFF.md`, historical references).
- [ ] **BRND-04**: Application UI metadata (titles, primary branding, Docker image names per scope) reflects Project Clip identity.

### Portfolio hierarchy & roles (Epic 4)

- [ ] **PORT-01**: User can create, read, update, and delete **clients** within their portfolio tenant.
- [ ] **PORT-02**: User can create, read, update, and delete **teams** under a project when teams are used.
- [ ] **PORT-03**: **Projects** reference `client_id` and carry extended fields: framework, CPS phase, SDD method, story style (per data model — nullable rollout as needed).
- [ ] **PORT-04**: Navigation **Portfolio → Client → Project → Team** is functional end-to-end.
- [ ] **PORT-05**: Projects listing supports filtering by client, team, CPS phase, and SDD method (minimum viable filters per PRD).
- [ ] **PORT-06**: **`role_catalog`** is seeded from the canonical role-directory export and is queryable for assignments.
- [ ] **PORT-07**: New portfolio entities enforce **tenant isolation** (no cross-`company_id` data access in CRUD paths covered by tests).

### CPS framework (Epic 5)

- [ ] **CPS-01**: New project defaults to **CPS** as the operating framework unless user selects an allowed alternative.
- [ ] **CPS-02**: **Setup → Production Flow → Value Activation** phases render on project detail with visible **gates** between phases.
- [ ] **CPS-03**: **Routine templates** materialize into live **routines** (with triggers) on kickoff for applicable CPS templates.
- [ ] **CPS-04**: **Deliverable templates** exist per CPS phase and can be instantiated or referenced for project work.
- [ ] **CPS-05**: **Gate transitions** require approval using existing **approvals** infrastructure (block until resolved).

### SDD method adapters (Epic 6)

- [ ] **METH-01**: **Method Adapter API** is implemented (`registerMethodAdapter` pattern per PRD) and documented for package authors.
- [ ] **METH-02**: **BMAD** adapter registers phases, deliverables linkage, progress behavior, and ProjectDetail rendering.
- [ ] **METH-03**: **Spec-Kit** adapter registers with the same contract.
- [ ] **METH-04**: **Taskmaster** adapter registers with the same contract.
- [ ] **METH-05**: **CAPS** adapter registers with the same contract.
- [ ] **METH-06**: Project kickoff or creation flow captures **Story Style** and **SDD method** selection.
- [ ] **METH-07**: **ProjectDetail** shows a **phase strip**, **gate badges**, and **adapter-driven progress** (not a generic single progress bar only).

### Portfolio dashboard & execution (Epic 7)

- [ ] **DASH-01**: **Portfolio** view shows a health/rollup presentation per **client** and **project** (minimum: visible status fields leading to health score).
- [ ] **DASH-02**: **CPS-weighted health score** (or agreed interim metric) is computed and displayed at portfolio level — exact weighting may iterate against open PRD questions.
- [ ] **DASH-03**: **Routines** run on schedule or trigger and produce **deliverable** records tied to the project.
- [ ] **DASH-04**: Deliverables **render** to **Markdown** and **DOCX** and appear on the project timeline or document store as specified.
- [ ] **DASH-05**: **`/weekly-heartbeat`** (or equivalent named routine) can generate a **draft** weekly status from project activity.

### Pilot (Epic 8)

- [ ] **PLT-01**: One **Growth Unit** is onboarded with realistic client/project data for the pilot window.
- [ ] **PLT-02**: **NPS** from GU lead is collected and **≥ 8/10** at pilot conclusion.
- [ ] **PLT-03**: **≥ 70%** adoption metric is tracked for pilot projects and met or exceeded.
- [ ] **PLT-04**: **Zero P0** defects remain open at pilot exit criteria.

### MVP GA (Epic 9)

- [ ] **GA-01**: Operator and user **documentation** is complete for v1 scope (install, auth, portfolio, CPS, methods, routines).
- [ ] **GA-02**: A **second GU** is onboarded successfully (production-hardening signal).
- [ ] **GA-03**: **Monitoring and alerting** cover production-critical paths.
- [ ] **GA-04**: **Security review/audit** completed with no unresolved critical findings blocking GA.
- [ ] **GA-05**: **v1.0.0** released; **SLA** or support expectations documented for internal operations.

---

## v2 Requirements

Deferred past v1.0.0; tracked for roadmap expansion.

### Additional SDD method adapters (Epic 10+)

- **ADPT-01**: Adapters for **GSD**, **OpenSpec**, **AI-SDD**, **SpecPulse**, **Spec Workflow MCP**, **ANWS** — one or more minors per PRD.

### Ticketing bridge (Epic 11+)

- **TICK-01**: Two-way sync with **Jira** (priority adapter).
- **TICK-02**: Adapters for **Asana**, **Azure DevOps**, **Linear** in PRD priority order.
- **TICK-03**: Per-project **field allow-list**, **redaction**, and **first-write approval** for outbound client-tool writes.

### Platform extensibility

- **EXT-01**: **Framework plugin interface** for non-CPS frameworks (v1.2+ per PRD).

---

## Out of Scope

| Item | Reason |
|------|--------|
| Client login / client-facing Project Clip UI | Internal-only tool; clients use their ticketing tool (Epic 11). |
| Replacing client ticketing systems | Sync bridge, not system of record. |
| Full revenue forecasting / billing | Read-only budget views; cockpit integration later. |
| Arbitrary custom frameworks in v1 | CPS + nine SDD methods only until plugin API. |
| Inventing roles not in role-directory | Single vocabulary — extend directory via PR first. |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| QUAL-01 | 1–10 | Pending |
| QUAL-02 | 1–4 | Pending |
| BOOT-01 | 1 | Pending |
| BOOT-02 | 1 | Pending |
| BOOT-03 | 1 | Pending |
| BOOT-04 | 1 | Pending |
| BOOT-05 | 1 | Pending |
| BOOT-06 | 1 | Pending |
| BOOT-07 | 1 | Pending |
| AUTH-01 | 2 | Pending |
| AUTH-02 | 2 | Pending |
| AUTH-03 | 2 | Pending |
| AUTH-04 | 2 | Pending |
| AUTH-05 | 2 | Pending |
| DATA-01 | 3 | Pending |
| DATA-02 | 3 | Pending |
| DATA-03 | 3 | Pending |
| DATA-04 | 3 | Pending |
| DATA-05 | 3 | Pending |
| BRND-01 | 4 | Pending |
| BRND-02 | 4 | Pending |
| BRND-03 | 4 | Pending |
| BRND-04 | 4 | Pending |
| PORT-01 | 5 | Pending |
| PORT-02 | 5 | Pending |
| PORT-03 | 5 | Pending |
| PORT-04 | 5 | Pending |
| PORT-05 | 5 | Pending |
| PORT-06 | 5 | Pending |
| PORT-07 | 5 | Pending |
| CPS-01 | 6 | Pending |
| CPS-02 | 6 | Pending |
| CPS-03 | 6 | Pending |
| CPS-04 | 6 | Pending |
| CPS-05 | 6 | Pending |
| METH-01 | 7 | Pending |
| METH-02 | 7 | Pending |
| METH-03 | 7 | Pending |
| METH-04 | 7 | Pending |
| METH-05 | 7 | Pending |
| METH-06 | 7 | Pending |
| METH-07 | 7 | Pending |
| DASH-01 | 8 | Pending |
| DASH-02 | 8 | Pending |
| DASH-03 | 8 | Pending |
| DASH-04 | 8 | Pending |
| DASH-05 | 8 | Pending |
| PLT-01 | 9 | Pending |
| PLT-02 | 9 | Pending |
| PLT-03 | 9 | Pending |
| PLT-04 | 9 | Pending |
| GA-01 | 10 | Pending |
| GA-02 | 10 | Pending |
| GA-03 | 10 | Pending |
| GA-04 | 10 | Pending |
| GA-05 | 10 | Pending |

**Coverage:**

- v1 requirements: **56** total (includes QUAL cross-cutting).
- Mapped to phases: **56** (QUAL-01 applies operationally to every phase).
- Unmapped: **0** ✓

---

*Requirements defined: 2026-04-13*  
*Last updated: 2026-04-13 after PRD + research synthesis*
