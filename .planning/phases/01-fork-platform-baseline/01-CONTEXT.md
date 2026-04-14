# Phase 1: Fork & platform baseline - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a **runnable Paperclip-based codebase** in the Project Clip repo with **all quality gates green** and **release tooling** validated (Epic 0 / `v0.0.1`). This phase does **not** add Neon migration, rebrand, or portfolio features — only fork import, CI, and semantic-release readiness per BOOT-01..BOOT-07 and QUAL-01..QUAL-02.

</domain>

<decisions>
## Implementation Decisions

### Fork import & baseline (Area 1)

- **D-01:** Start from the **local Paperclip clone** as the source of truth — bring the tree over **as-is** (no architectural redesign in Phase 1).
- **D-02:** **Fix failing tests** until the suite is green on that baseline before treating the fork as “baseline complete”; **subsequent work is user-led** (manual progression, not automated scaffolding beyond standard repo hygiene).

### CI & e2e (Area 2)

- **D-03:** **CI workflow structure** — match **Paperclip upstream** (same job split, naming, and triggers as the original project). When the fork lands in this repo, **port or mirror** upstream’s workflow YAML patterns rather than inventing a new layout.
- **D-04:** **E2e strategy** — follow **Paperclip’s original strategy** (when `pnpm test:e2e` runs, which branches, and failure policy). Do not introduce a stricter or looser policy in Phase 1 without an explicit later decision.

### Toolchain (Area 3)

- **D-05:** **Pin Node and pnpm to match upstream Paperclip** (PROJECT.md currently cites **Node 20+** and **pnpm 9** monorepo). Prefer **exact alignment** with the fork’s root `package.json` / `packageManager` / CI matrix over bumping versions in Phase 1.

### Release engineering (Area 4)

- **D-06:** **semantic-release config validation** — run **`semantic-release --dry-run`** (or the project’s equivalent) on **merge to `main`**, not on every PR by default. (Optional: add PR-scoped checks only when release config files change — Claude’s discretion during planning if needed.)
- **D-07:** **First release expectation** — first successful automated release from **`main`** should align with **Epic 0** as **`v0.0.1`** patch semantics, with **Conventional Commits** and PRD **Epics 0–3** bootstrapping guidance (`fix:`-style commits where applicable per PRD §2.2).

### Claude's Discretion

- Minor CI niceties (caching keys, job naming) **as long as** behavior stays equivalent to Paperclip’s strategy per **D-03** and **D-04**.
- Whether to add a **path-filter** for dry-run on PRs that only touch `.releaserc` / release plugins — only if it reduces noise without violating **D-06**’s spirit.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & requirements

- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, BOOT/QUAL traceability.
- `.planning/REQUIREMENTS.md` — BOOT-01..BOOT-07, QUAL-01, QUAL-02 definitions.
- `.planning/PROJECT.md` — stack constraints, quality gate order, pnpm/Node expectations, fork source note.

### Product & release policy

- `projectclip-prd.md` — Epic 0 scope, semantic-release + Conventional Commits, pre-1.0 bootstrapping (`fix:` patch bumps for Epics 0–3).

### Upstream fork reference (not in this repo)

- **Paperclip clone (local):** `/Users/danielvm/Sites/paperclip` — **authoritative reference** for CI layout, e2e policy, and toolchain pins until the fork is copied into this repository. Planners should **diff workflows and `package.json`** from this tree when generating Phase 1 tasks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **None in `projectclip-gsd` yet** — this workspace is planning-first; the application monorepo arrives with the Paperclip import. Use the **local Paperclip clone** as the live pattern source for scripts, workspaces, and CI.

### Established Patterns

- **Paperclip upstream** defines the canonical pattern for **pnpm workspaces**, **Vitest**, **Playwright e2e**, and **CI** — Phase 1 **inherits** these per D-03 and D-04.

### Integration Points

- After import: **GitHub Actions** (or upstream’s CI host) entrypoints, **root `package.json` scripts**, and **semantic-release** config (e.g. `.releaserc` / `release.config.*`) must satisfy BOOT-06 and D-06.

</code_context>

<specifics>
## Specific Ideas

- User preference: **start from Paperclip as-is**, **fix tests**, then **move forward manually** — no expectation of automated multi-step import beyond normal git/copy and documentation (`FORK_DIFF.md` per BOOT-07).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-fork-platform-baseline*
*Context gathered: 2026-04-13*
