# Phase 1: Fork & platform baseline — Research

**Researched:** 2026-04-14  
**Domain:** Monorepo import (pnpm), GitHub Actions CI, Vitest/Playwright, release automation vs semantic-release  
**Confidence:** HIGH for upstream workflow/scripts (read from tree); MEDIUM for semantic-release integration (requires new config; not present upstream)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Start from the **local Paperclip clone** as the source of truth — bring the tree over **as-is** (no architectural redesign in Phase 1).
- **D-02:** **Fix failing tests** until the suite is green on that baseline before treating the fork as “baseline complete”; **subsequent work is user-led** (manual progression, not automated scaffolding beyond standard repo hygiene).
- **D-03:** **CI workflow structure** — match **Paperclip upstream** (same job split, naming, and triggers as the original project). When the fork lands in this repo, **port or mirror** upstream’s workflow YAML patterns rather than inventing a new layout.
- **D-04:** **E2e strategy** — follow **Paperclip’s original strategy** (when `pnpm test:e2e` runs, which branches, and failure policy). Do not introduce a stricter or looser policy in Phase 1 without an explicit later decision.
- **D-05:** **Pin Node and pnpm to match upstream Paperclip** (PROJECT.md currently cites **Node 20+** and **pnpm 9** monorepo). Prefer **exact alignment** with the fork’s root `package.json` / `packageManager` / CI matrix over bumping versions in Phase 1.
- **D-06:** **semantic-release config validation** — run **`semantic-release --dry-run`** (or the project’s equivalent) on **merge to `main`**, not on every PR by default. (Optional: add PR-scoped checks only when release config files change — Claude’s discretion during planning if needed.)
- **D-07:** **First release expectation** — first successful automated release from **`main`** should align with **Epic 0** as **`v0.0.1`** patch semantics, with **Conventional Commits** and PRD **Epics 0–3** bootstrapping guidance (`fix:`-style commits where applicable per PRD §2.2).

### Claude's Discretion

- Minor CI niceties (caching keys, job naming) **as long as** behavior stays equivalent to Paperclip’s strategy per **D-03** and **D-04**.
- Whether to add a **path-filter** for dry-run on PRs that only touch `.releaserc` / release plugins — only if it reduces noise without violating **D-06**’s spirit.

### Deferred Ideas (OUT OF SCOPE)

- None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (from REQUIREMENTS.md) | Research support |
|----|-----------------------------------|------------------|
| BOOT-01 | Complete Paperclip fork; `pnpm install` on clean checkout | Import tree from `/Users/danielvm/Sites/paperclip`; keep `packageManager` `pnpm@9.15.4` [VERIFIED: `paperclip/package.json`]. |
| BOOT-02 | `pnpm -r typecheck` passes | Same command as upstream CI `verify` job [VERIFIED: `paperclip/.github/workflows/pr.yml`]. |
| BOOT-03 | `pnpm test:run` (Vitest) passes | Root script runs `vitest run` after workspace preflight [VERIFIED: `paperclip/package.json`, `paperclip/vitest.config.ts` projects]. |
| BOOT-04 | `pnpm build` succeeds | CI runs `pnpm build` after tests [VERIFIED: `pr.yml`]. |
| BOOT-05 | `pnpm test:e2e` when e2e in scope | PR workflow: dedicated `e2e` job; Playwright + `pnpm run test:e2e` [VERIFIED: `pr.yml`]. |
| BOOT-06 | semantic-release configured; CI validates release pipeline | **Gap:** upstream has **no** `semantic-release`, `.releaserc`, or `release.config.*` [VERIFIED: repo search + `release.yml`/`release.sh`]. Satisfy BOOT-06 by **adding** semantic-release + CI dry-run on `main` per D-06; document vs `scripts/release.sh` in `FORK_DIFF.md`. |
| BOOT-07 | `FORK_DIFF.md` tracks structural divergence | Required when introducing semantic-release, default branch (`main` vs `master`), or any CI/release deviation from Paperclip. |
| QUAL-01 | CI: frozen install, typecheck, `test:run`, build, `test:e2e` before release | PR `verify` matches install/typecheck/test/build; `e2e` job runs e2e. **Note:** `release.yml` push path uses `pnpm install --no-frozen-lockfile` [VERIFIED] — differs from QUAL-01; planner should align release jobs with QUAL-01 or document exception in `FORK_DIFF.md`. |
| QUAL-02 | Conventional Commits + semantic-release (angular preset); Epics 0–3 use `fix` where applicable | **Upstream:** CalVer-style npm publish via `release.sh` (YYYY.MDD.P), not Conventional Commits analyzer [VERIFIED: `paperclip/scripts/release.sh`]. Phase 1 must **introduce** semantic-release + commit discipline per PRD/QUAL-02 while preserving Paperclip CI **shape** where possible (D-03). |
</phase_requirements>

## Summary

Phase 1 is an **infra and import** phase: copy the Paperclip monorepo into the Project Clip repository, get **Vitest** and **Playwright** green, and make **release validation** ready. Upstream Paperclip’s CI is well-structured: PRs run **policy**, then parallel **verify** (typecheck → unit tests → build → canary **dry-run** via `./scripts/release.sh`) and **e2e** (build → Playwright browsers → `pnpm run test:e2e` with `PAPERCLIP_E2E_SKIP_LLM=true`). A separate **`E2E Tests`** workflow exists for **manual** `workflow_dispatch` with optional LLM and `ANTHROPIC_API_KEY` [VERIFIED: `e2e.yml`]. **Release** automation on push to **`master`** runs verify then publishes canary via `release.sh`; stable path is dispatch-based [VERIFIED: `release.yml`].

The main planning tension is **documented and locked**: PROJECT.md / REQUIREMENTS / D-06–D-07 assume **semantic-release**, **angular preset**, **`main`**, and **semver `v0.0.1`**, while Paperclip uses **`master`**, **`scripts/release.sh`**, and **CalVer npm tags** with **no** semantic-release in the tree [VERIFIED]. The planner should treat **semantic-release as new work** (BOOT-06 / QUAL-02 / D-06), not as something to “discover” in the fork, and record all behavioral differences in **BOOT-07** (`FORK_DIFF.md`).

**Primary recommendation:** Port **workflow names, job boundaries, and triggers** from Paperclip (D-03/D-04), then **add** a **`main`-only** semantic-release dry-run job (D-06) and **retain or consciously retire** `release.sh` for npm publishing — with explicit decisions captured in `FORK_DIFF.md`.

## Project Constraints (from .cursor/rules/)

| Source | Directive (actionable for Phase 1 implementation) |
|--------|-----------------------------------------------------|
| `imported/helpers/clean-code.mdc` | TDD discipline, small functions, no broken windows; tests first for fixes (aligns with D-02). |
| `imported/helpers/bug-fix.mdc` | Conventional Commits for fixes; explicit file lists for `git add`; do not run `git`/`gh` on user’s behalf in that workflow (repo hygiene still user-operated unless automated elsewhere). |

No `.cursor/rules/` directive forbids semantic-release or pnpm; stack stays Paperclip-aligned per PROJECT.md.

## Standard Stack

### Core

| Library / tool | Version (upstream / registry) | Purpose | Why Standard |
|----------------|-------------------------------|---------|--------------|
| pnpm | `9.15.4` in `packageManager` [VERIFIED: `paperclip/package.json`]; `npm view pnpm` → `10.33.0` [VERIFIED: npm registry] | Workspace installs, filters | Upstream pins 9.x; **D-05** — stay on fork’s pin for Phase 1, do not chase pnpm 10. |
| Node.js | `>=20` engines [VERIFIED]; CI uses **24** in `pr.yml` / `release.yml` [VERIFIED]; `e2e.yml` uses **20** [VERIFIED] | Runtime | Align Phase 1 CI matrix with **Paperclip’s YAML**, not only `engines` (matrix is authoritative for CI). |
| TypeScript | `^5.7.3` devDependency root [VERIFIED] | Typecheck | Inherited monorepo standard. |
| Vitest | `^3.0.5` root [VERIFIED]; `npm view vitest` → `4.1.4` [VERIFIED: npm registry] | Unit/integration via `pnpm test:run` | Stay on 3.x unless upstream bumps; Phase 1 avoids major bump without cause. |
| Playwright | `@playwright/test` `^1.58.2` [VERIFIED]; `npm view @playwright/test` → `1.59.1` [VERIFIED] | E2E (`pnpm test:e2e`) | CI installs Chromium with deps [VERIFIED: `pr.yml`]. |

### Supporting

| Item | Purpose |
|------|---------|
| `scripts/release.sh` | Canary/stable npm publish, `--dry-run`, version rewrite [VERIFIED: `paperclip/scripts/release.sh`]. |
| Root `vitest.config.ts` `test.projects` | Fans out to `packages/*`, `server`, `ui`, `cli` [VERIFIED]. |

### Alternatives Considered

| Instead of | Could use | Tradeoff |
|------------|-----------|----------|
| Paperclip `release.sh` | semantic-release only | REQUIREMENTS + D-06 require semantic-release; may still need migration path for npm artifacts until unified. |
| CI Node 24 | Node 20 only | Would diverge from upstream CI files (violates D-05 spirit for “CI matrix = upstream”). |

**Installation (post-import):** [VERIFIED pattern] `pnpm install --frozen-lockfile` in PR CI.

## Architecture Patterns

### Upstream GitHub Actions layout [VERIFIED]

| Workflow file | `on` | Jobs / purpose |
|---------------|------|------------------|
| `pr.yml` (`name: PR`) | `pull_request` → **`master`** | **`policy`**: block direct `pnpm-lock.yaml` edits (except branch `chore/refresh-lockfile`), Dockerfile `deps` stage vs workspace `package.json` sync, conditional `pnpm install --lockfile-only` when manifests change. **`verify`** (needs `policy`): `pnpm install --frozen-lockfile` → `pnpm -r typecheck` → `pnpm test:run` → `pnpm build` → `./scripts/release.sh canary --skip-verify --dry-run`. **`e2e`** (needs `policy`): install → build → `npx playwright install --with-deps chromium` → write `~/.paperclip/instances/default/config.json` → `pnpm run test:e2e` with `PAPERCLIP_E2E_SKIP_LLM=true` → artifact upload. **Concurrency:** `pr-${{ github.event.pull_request.number }}`, cancel in progress. |
| `e2e.yml` (`name: E2E Tests`) | **`workflow_dispatch`** only | Single `e2e` job: pnpm **9** (unpinned minor) [VERIFIED], Node **20**, optional `skip_llm` input → `PAPERCLIP_E2E_SKIP_LLM`, passes `ANTHROPIC_API_KEY` from secrets, then same Playwright + `pnpm run test:e2e` pattern. |
| `release.yml` (`name: Release`) | **`push`** to **`master`**; `workflow_dispatch` for stable | **`verify_canary`** (push): install **without** frozen lockfile → typecheck → test → build. **`publish_canary`**: restore lockfile, git author, `./scripts/release.sh canary --skip-verify`, push `canary/v*` tag. **Dispatch path:** `verify_stable` → `preview_stable` (dry-run) or `publish_stable` + GitHub release script. **Environments:** `npm-canary`, `npm-stable`. **Permissions:** `contents: write`, `id-token: write` on publish jobs. |

**Unit vs e2e invocation:** Unit path is **`pnpm test:run`** (Vitest). E2e path is **`pnpm test:e2e`** → `npx playwright test --config tests/e2e/playwright.config.ts` [VERIFIED: `package.json`]. Playwright starts **`pnpm paperclipai run`** as webServer against health URL [VERIFIED: `tests/e2e/playwright.config.ts`].

### Recommended repo steps after import

1. Preserve **job split** (`policy` / `verify` / `e2e`) and workflow file names where possible (D-03).
2. If default branch is **`main`**, update `on.pull_request.branches` / `on.push.branches` in all three workflows and document in `FORK_DIFF.md` (D-03 allows naming parity with **behavior**, but branch rename is mechanical).
3. Add **semantic-release** dry-run on **`push` to `main`** (D-06); keep PR’s `release.sh canary --dry-run` only if still meaningful once semantic-release owns versioning — otherwise replace with path-filtered config check (Claude’s discretion).

### Anti-patterns to avoid

- **Assuming** upstream has `.releaserc` — it does not [VERIFIED].
- **Dropping** the `e2e` job from PRs if Paperclip runs it — violates D-04 unless explicitly re-decided.
- **Silently changing** `pnpm install --frozen-lockfile` on release publish jobs without documenting QUAL-01 impact.

## Don’t Hand-Roll

| Problem | Don’t build | Use instead | Why |
|---------|-------------|-------------|-----|
| Release notes / version bumps from commits | Custom parsers | **semantic-release** + official plugins (angular preset per QUAL-02) | COMMIT parsing and changelog generation are edge-heavy [ASSUMED: ecosystem practice]. |
| Browser automation | Scripting Chrome by hand | **Playwright** (already standard) | Upstream config, trace, retries already set [VERIFIED: `playwright.config.ts`]. |
| Multi-package test orchestration | One-off runners | Root **Vitest projects** | Already encodes workspace layout [VERIFIED: `vitest.config.ts`]. |

**Key insight:** Upstream already paid the tax for monorepo CI; Phase 1 **inherits** it, then **layers** semantic-release per product requirements.

## Runtime State Inventory

| Category | Items found | Action required |
|----------|-------------|-----------------|
| Stored data | None in Project Clip repo pre-import | N/A |
| Live service config | Paperclip CI writes local default instance config under `~/.paperclip/` **inside CI** only [VERIFIED: `pr.yml`] | Keep step when porting e2e job; no migration. |
| OS-registered state | None for Phase 1 | — |
| Secrets / env | `e2e.yml` references `secrets.ANTHROPIC_API_KEY` [VERIFIED]; PR e2e sets `PAPERCLIP_E2E_SKIP_LLM` [VERIFIED] | Ensure forked repo secrets documented; never log keys. |
| Build artifacts | `release.sh` rewrites versions and restores tree [VERIFIED] | Understand cleanup traps before changing release flow. |

## Common Pitfalls

### Pitfall 1: `master` vs `main` drift

**What goes wrong:** Workflows never run after rename.  
**Why:** All three workflows target **`master`** [VERIFIED].  
**How to avoid:** Global replace for default branch + update branch protection docs.  
**Warning signs:** PRs show no checks.

### Pitfall 2: Node version mismatch across workflows

**What goes wrong:** Flaky or unreproducible CI.  
**Why:** PR/release use Node **24**, standalone `e2e.yml` uses Node **20** [VERIFIED].  
**How to avoid:** Treat **PR + release** as primary; align dispatch e2e to same matrix unless there is a documented reason.

### Pitfall 3: Frozen lockfile vs release workflow

**What goes wrong:** “Green locally” doesn’t match release path.  
**Why:** `release.yml` uses `pnpm install --no-frozen-lockfile` [VERIFIED]; PR uses `--frozen-lockfile` [VERIFIED].  
**How to avoid:** Reconcile with QUAL-01 or document explicit exception.

### Pitfall 4: Confusing `release.sh` dry-run with semantic-release

**What goes wrong:** BOOT-06 appears satisfied by canary dry-run only.  
**Why:** `release.sh` exercises **npm publish dry-run**, not **semantic-release** [VERIFIED].  
**How to avoid:** Add explicit `semantic-release --dry-run` (or documented equivalent) on `main` per D-06.

## Code Examples

### Vitest entry (root)

```typescript
// Source: paperclip/vitest.config.ts [VERIFIED]
export default defineConfig({
  test: {
    projects: [
      "packages/db",
      "packages/adapters/codex-local",
      "packages/adapters/opencode-local",
      "server",
      "ui",
      "cli",
    ],
  },
});
```

### Playwright + webServer (e2e)

```typescript
// Source: paperclip/tests/e2e/playwright.config.ts (excerpt) [VERIFIED]
webServer: {
  command: `pnpm paperclipai run`,
  url: `${BASE_URL}/api/health`,
  // ...
},
```

## State of the Art

| Old / upstream | Project Clip target | Notes |
|----------------|---------------------|--------|
| CalVer + `release.sh` | semver + semantic-release (QUAL-02, D-07) | Requires new tooling and `FORK_DIFF.md`. |
| `master` default | `main` (D-06) | Workflow YAML must follow. |

**Deprecated/outdated:** N/A for Phase 1 import (no deprecation changes required beyond new release path).

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|----------------|
| A1 | semantic-release angular preset is the intended analyzer for QUAL-02 | Standard stack / phase_requirements | Wrong changelog or version bumps if preset differs. |
| A2 | First automated semver tag `v0.0.1` is acceptable alongside or instead of Paperclip’s dated stable tags | Summary | Release policy confusion; clarify in plan. |

**If semantic-release is added:** Remove claims from A1 once `.releaserc` / `release.config.*` is committed and verified.

## Open Questions (RESOLVED)

Planning locked the following; executors should implement per `01-03-PLAN.md` / `01-04-PLAN.md` and `FORK_DIFF.md`.

1. **Coexistence of `release.sh` and semantic-release** — **RESOLVED:** Dual path for Phase 1: `scripts/release.sh` remains the npm canary/stable publish path; **semantic-release** owns semver tags, changelog, and GitHub release generation on `main` (dry-run validates config). Unification into a single pipeline is explicitly **deferred** past Epic 0.

2. **QUAL-01 vs `release.yml` install flags** — **RESOLVED:** Prefer `--frozen-lockfile` on any job that should match QUAL-01 reproducibility; if upstream `release.yml` keeps non-frozen install for a publish-only path, document the exception and rationale in `FORK_DIFF.md` (Option B: parity exception) rather than silently diverging.

## Environment Availability

> Phase 1 assumes GitHub Actions runners; local dev should match `engines` and CI for debugging.

| Dependency | Required by | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node | CI + dev | ✓ (runner / local) | CI: 24 (PR/release), 20 (e2e dispatch) [VERIFIED] | Use same as workflow under test |
| pnpm | Monorepo | ✓ | 9.15.4 pinned in repo [VERIFIED] | — |
| Playwright browsers | `test:e2e` | ✓ in CI via `npx playwright install --with-deps chromium` [VERIFIED] | Chromium | Install locally for debugging |
| npm publish / OIDC | `release.sh` publish jobs | ✓ in upstream environments `npm-canary` / `npm-stable` [VERIFIED] | — | Project Clip needs own npm + GitHub secrets/environments |
| `ANTHROPIC_API_KEY` | Optional LLM in dispatch e2e | Repo secret | — | Omit or skip LLM via `skip_llm` / `PAPERCLIP_E2E_SKIP_LLM` |

**Missing dependencies with no fallback:** GitHub **environments** and secrets for npm OIDC if automated publish is in scope for Phase 1.  
**Missing dependencies with fallback:** LLM key — use skip flags [VERIFIED].

## Validation Architecture

> `workflow.nyquist_validation` is **enabled** in `.planning/config.json` [VERIFIED].

### Test framework

| Property | Value |
|----------|-------|
| Unit / integration framework | Vitest `^3.0.5` [VERIFIED: `paperclip/package.json`] |
| Root config | `vitest.config.ts` (workspace **projects**) [VERIFIED] |
| E2E framework | Playwright `@playwright/test` `^1.58.2` [VERIFIED] |
| E2E config | `tests/e2e/playwright.config.ts` [VERIFIED] |
| Quick unit run | `pnpm test:run` [VERIFIED] |
| Watch mode | `pnpm test` → `vitest` [VERIFIED] |
| E2E run | `pnpm test:e2e` → `npx playwright test --config tests/e2e/playwright.config.ts` [VERIFIED] |
| E2E headed | `pnpm test:e2e:headed` [VERIFIED] |

### Phase requirements → test map

| Req ID | Behavior | Test type | Automated command | Notes |
|--------|----------|-----------|-------------------|-------|
| BOOT-02 | Workspace typechecks | CI + local | `pnpm -r typecheck` | [VERIFIED] |
| BOOT-03 | Vitest suite | CI + local | `pnpm test:run` | [VERIFIED] |
| BOOT-04 | Production build | CI + local | `pnpm build` | [VERIFIED] |
| BOOT-05 | Playwright e2e | CI + local | `pnpm test:e2e` | Needs Playwright browsers; CI injects config [VERIFIED: `pr.yml`] |
| BOOT-06 | Release config valid | CI (planned) | `semantic-release --dry-run` on `main` | **Not in upstream** — Wave 0 gap |
| QUAL-01 | Full gate ordering | CI | Mirror `verify` + `e2e` + install flags | Align `release.yml` or document delta |

### Sampling rate (recommended)

- **Per task / commit:** `pnpm test:run` (and scoped package tests if touching one workspace).
- **Pre-merge / phase gate:** `pnpm install --frozen-lockfile && pnpm -r typecheck && pnpm test:run && pnpm build && pnpm test:e2e` (e2e as per D-04).

### Wave 0 gaps

- [ ] Add **semantic-release** config + documented **`semantic-release --dry-run`** job on **`push` to `main`** (D-06 / BOOT-06).
- [ ] Confirm **default branch** + workflow triggers consistent (`main` vs `master`).
- [ ] Decide **frozen lockfile** policy for release workflows vs QUAL-01.

## Security Domain (CI / infra)

Brief ASVS-oriented notes for this phase (mostly pipelines and secrets):

| ASVS area | Applies | Control |
|-----------|---------|---------|
| V1 Architecture | Yes | Keep least-privilege `permissions` on workflows; mirror upstream `contents: read` vs write only on publish jobs [VERIFIED: `release.yml`]. |
| V2 Authentication | Partial | `GITHUB_TOKEN` / `github.token` for release creation — scope minimally; use environments for npm [VERIFIED: `release.yml`]. |
| V5 Input validation | Low | Workflow `inputs` for dispatch — validate format in scripts before use [ASSUMED]. |
| V7 Error handling / logging | Yes | Ensure **secrets are not printed** in `release.sh` / CI logs; redact `ANTHROPIC_API_KEY` usage [VERIFIED: secret referenced only in `env` in `e2e.yml`]. |
| V9 Security logging | Partial | Upload Playwright reports as artifacts (no secrets in traces) [VERIFIED: artifact paths]. |

**Threat patterns:** **Credential leakage** via logs or forked PRs from untrusted contributors — use `pull_request_target` only if absolutely required (upstream does not [VERIFIED]); avoid echoing tokens.

## Sources

### Primary (HIGH — read from filesystem)

- `/Users/danielvm/Sites/paperclip/package.json` — scripts, engines, packageManager, devDependencies
- `/Users/danielvm/Sites/paperclip/pnpm-workspace.yaml` — workspace roots
- `/Users/danielvm/Sites/paperclip/.github/workflows/pr.yml` — PR jobs, triggers, commands
- `/Users/danielvm/Sites/paperclip/.github/workflows/e2e.yml` — dispatch e2e, Node 20, secrets
- `/Users/danielvm/Sites/paperclip/.github/workflows/release.yml` — canary/stable pipeline
- `/Users/danielvm/Sites/paperclip/scripts/release.sh` — dry-run, verify gate, publish
- `/Users/danielvm/Sites/paperclip/vitest.config.ts`, `/Users/danielvm/Sites/paperclip/tests/e2e/playwright.config.ts`
- `/Users/danielvm/Sites/projectclip-gsd/.planning/phases/01-fork-platform-baseline/01-CONTEXT.md`
- `/Users/danielvm/Sites/projectclip-gsd/.planning/REQUIREMENTS.md`, `PROJECT.md`, `config.json`
- Shell search: `rg` for `semantic-release` / `.releaserc` / `release.config` in Paperclip → **no files** [VERIFIED]
- `npm view vitest version`, `npm view @playwright/test version`, `npm view pnpm version` [VERIFIED: npm registry]

## Metadata

**Confidence breakdown**

- Standard stack: **HIGH** — pinned in upstream `package.json` / workflows.
- Architecture (CI): **HIGH** — workflows read in full.
- Release (semantic-release): **MEDIUM** — not present upstream; integration is planned, not verified in a running Clip repo.

**Research date:** 2026-04-14  
**Valid until:** ~2026-05-14 (re-check if Paperclip upstream changes default branch, Node matrix, or release scripts)
