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
