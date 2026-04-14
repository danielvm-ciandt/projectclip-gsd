# Fork divergence — Project Clip vs Paperclip

## Provenance

- **Source:** Local Paperclip clone at `/Users/danielvm/Sites/paperclip`.
- **Imported revision:** `5d1ed71779df5622d9fd99ad28816b2da4bdee31` (see `git -C` that path for current upstream HEAD when re-syncing).
- **Target:** This repository’s remote should be the Project Clip origin (not the upstream Paperclip remote), per team practice.

## Default branch

- **Upstream Paperclip** uses the default branch **`master`**.
- **Project Clip** targets **`main`** for release automation (D-06). Follow-up plans retarget GitHub Actions and release workflows from `master` to `main` without changing job boundaries (D-03).

## Toolchain pins (D-05)

- **packageManager:** `pnpm@9.15.4` (root `package.json`) — do not bump in Phase 1 (D-05).
- **CI Node matrix:** Mirror Paperclip workflows once ported — **PR / release:** Node **24**; **dispatch e2e** (`e2e.yml`): Node **20** (see `.github/workflows/pr.yml`, `.github/workflows/e2e.yml`, `.github/workflows/release.yml` after import).

## Release tooling (placeholder)

Upstream uses **`scripts/release.sh`** for CalVer-style npm publishing (canary/stable). Project Clip will add **semantic-release** with the **angular** preset per BOOT-06 / D-06 / QUAL-02; coexistence with `release.sh` and the **`v0.0.1`** bootstrap policy (D-07) are documented and implemented in plan **01-04**.

## CI workflows (Phase 1)

- **Default branch:** Triggers and filters use **`main`** instead of **`master`** in `.github/workflows/pr.yml`, `e2e.yml`, `release.yml`, `docker.yml`, and `refresh-lockfile.yml` (D-03).
- **Job parity:** `policy` → `verify` → `e2e` layout in `pr.yml` matches upstream Paperclip (D-03). PR **`verify`** runs `pnpm install --frozen-lockfile`, `pnpm -r typecheck`, `pnpm test:run`, `pnpm build`, then `./scripts/release.sh canary --skip-verify --dry-run` on a **`main`** detached checkout for the canary dry-run step.
- **E2e:** PR **`e2e`** job sets `PAPERCLIP_E2E_SKIP_LLM=true` and runs `pnpm run test:e2e` after Playwright install (D-04).
- **QUAL-01 — `release.yml` `verify_canary`:** Uses **`pnpm install --frozen-lockfile`** (Option A) for reproducible installs on push to `main`. **Publish** jobs (`publish_canary`, `publish_stable`, and `workflow_dispatch` verify paths) still use **`pnpm install --no-frozen-lockfile`** where upstream did, so npm publish can refresh the lockfile when publishing — documented here as an intentional exception to strict frozen installs on those paths only.
- **Node matrix:** **Node 24** on PR `verify` / `e2e` and release verify jobs; **Node 20** on `e2e.yml` dispatch — mirrors upstream (D-05).

## Release tooling — dual path (Phase 1)

- **`scripts/release.sh`:** Still the **npm canary/stable publish** path (CalVer-style tags and version rewrite). CI **`verify`** jobs may call it for canary dry-run; do not remove until release automation is unified.
- **semantic-release:** Owns **semver tags**, **GitHub Releases**, and **CHANGELOG** generation on `main` per QUAL-02. A **`semantic-release.yml`** workflow runs **`npx semantic-release --dry-run`** on **push to `main`** only (D-06); no publish from semantic-release in Phase 1 (`npmPublish: false` in `.releaserc.json`).
- **Coexistence:** `release.sh` remains the npm publish path; semantic-release dry-run must pass on each push to `main` before full publish automation is enabled in a later milestone.
- **D-07 / Epic 0:** First automated semver release from `main` targets **`v0.0.1`** patch semantics; Epics 0–3 commits should prefer `fix(...):` per PRD §2.2 where applicable.

## Default branch summary

- All Project Clip automation assumes the GitHub default branch **`main`** (not `master`).

## Phase 2: Neon Auth

- `server/src/auth/neon-auth.ts` — NEW: Neon Auth proxy handler and session resolver
  replacing self-hosted Better Auth when PAPERCLIP_AUTH_PROVIDER=neon
- `PAPERCLIP_AUTH_PROVIDER` env var controls auth cutover (default: better-auth)
- Neon Auth Beta status: acceptable for internal deployment
- Legacy better-auth path preserved during cutover; removal planned in Phase 2 cleanup (plan 02-04)
