---
phase: 01
slug: fork-platform-baseline
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-14
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Dev machine → pnpm registry | Installing packages pulls executable code; supply-chain risk. | Lockfile-resolved package tarballs |
| migrate.ts → local DB | Migration runner executes DDL; protect DB URL and credentials. | Connection string (never logged in `migrate.ts`) |
| Test code → filesystem / network | E2e may hit local server; fixtures must avoid production secrets. | localhost HTTP; Playwright traces |
| GitHub Actions → secrets / OIDC | Workflows access `GITHUB_TOKEN`, npm OIDC, optional API keys in dispatch. | Short-lived tokens; repo secrets by name |
| Fork PRs from untrusted contributors | `GITHUB_TOKEN` on `pull_request` must stay minimal. | PR-scoped token; `main`-only trigger |
| semantic-release → GitHub API | Uses `GITHUB_TOKEN` / `GH_TOKEN` for releases and tags when not dry-run. | GitHub API credentials |
| npm / OIDC | `@semantic-release/npm` must not publish until explicitly enabled. | Future publish trust (Phase 1: dry-run only) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-1-01 | Spoofing | pnpm install | mitigate | `pnpm install --frozen-lockfile` in CI (e.g. `.github/workflows/pr.yml` verify/e2e, `semantic-release.yml`). | closed |
| T-1-02 | Tampering | copied tree vs upstream | mitigate | `FORK_DIFF.md` **Provenance** — imported revision `5d1ed71779df5622d9fd99ad28816b2da4bdee31`. | closed |
| T-1-03 | Repudiation | import provenance | mitigate | `FORK_DIFF.md` Provenance + revision string. | closed |
| T-1-04 | Information disclosure | logs during migrate | mitigate | `packages/db/src/migrate.ts` logs source label only; does not echo `DATABASE_URL`. | closed |
| T-1-05 | Denial of service | broken migrations | mitigate | Blocking verification: `db:migrate` script in root `package.json`; migration failure fails the runner. | closed |
| T-1-06 | Elevation | arbitrary scripts in dependencies | accept | Same as upstream Paperclip baseline; defer dependency hardening to a later security milestone. | closed |
| T-2-01 | Information disclosure | e2e traces / reports | mitigate | `.gitignore` includes `tests/e2e/test-results/` and `tests/release-smoke/test-results/`. | closed |
| T-2-02 | Tampering | relaxed tests | mitigate | No `test.skip` / `test.only` in `tests/e2e/`; `FORK_DIFF.md` documents quality gates (D-02 / real fixes). | closed |
| T-2-03 | Denial of service | e2e hangs | mitigate | `tests/e2e/playwright.config.ts` — `webServer.timeout: 120_000`, test `timeout: 60_000`. | closed |
| T-2-04 | Elevation | arbitrary `exec` in tests | accept | Inherited from upstream test patterns; no broad `exec` usage found under `tests/e2e/`. | closed |
| T-3-01 | Spoofing | workflow triggers | mitigate | `.github/workflows/pr.yml` — `pull_request` to `main` only; no `pull_request_target` in repo. | closed |
| T-3-02 | Tampering | npm publish jobs | mitigate | `.github/workflows/release.yml` — `id-token: write` on `publish_canary` / publish jobs that need OIDC; verify jobs `contents: read`. | closed |
| T-3-03 | Repudiation | release tags | mitigate | `FORK_DIFF.md` **Release tooling** documents CalVer vs semantic-release and tag behavior. | closed |
| T-3-04 | Information disclosure | secrets in logs | mitigate | `semantic-release.yml` passes `GITHUB_TOKEN` via `env:` only; no `echo` of tokens in workflows (repo-wide grep). | closed |
| T-3-05 | Denial of service | malicious PR resource burn | accept | Same concurrency `cancel-in-progress` pattern as upstream (`pr.yml`). Residual DoS accepted. | closed |
| T-3-06 | Elevation | overly broad `permissions` | mitigate | Jobs use scoped permissions (e.g. `semantic-release.yml` job `contents: read`; publish jobs gated). | closed |
| T-4-01 | Tampering | unauthorized npm publish | mitigate | `.releaserc.json` — `["@semantic-release/npm", { "npmPublish": false }]`. | closed |
| T-4-02 | Information disclosure | NPM_TOKEN in workflow | mitigate | No `NPM_TOKEN` references in `.github/workflows` or package manifests (grep). | closed |
| T-4-03 | Spoofing | wrong branch releasing | mitigate | `.releaserc.json` — `"branches": ["main"]`; `semantic-release.yml` `on.push.branches: [main]`. | closed |
| T-4-04 | Denial of service | duplicate release jobs | mitigate | Single `semantic_release_dry_run` job; not triggered on `pull_request` (comment in workflow). | closed |
| T-4-05 | Repudiation | missing changelog | mitigate | `@semantic-release/changelog` in `.releaserc.json` plugin graph. | closed |

*Status: open · closed*  
*Disposition: mitigate · accept (documented below) · transfer*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01-01 | T-1-06 | Dependency script risk matches upstream Paperclip; hardening tracked for a future ASVS-focused phase. | GSD secure-phase audit | 2026-04-14 |
| AR-01-02 | T-2-04 | Upstream-inherited test patterns; scope reviewed — no new privileged exec paths under e2e for this phase. | GSD secure-phase audit | 2026-04-14 |
| AR-01-03 | T-3-05 | GitHub Actions concurrency limits malicious PR fan-out same as upstream; residual abuse accepted. | GSD secure-phase audit | 2026-04-14 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-14 | 21 | 21 | 0 | gsd-secure-phase (Phase 01) |

### Security Audit 2026-04-14

| Metric | Count |
|--------|-------|
| Threats found | 21 |
| Closed | 21 |
| Open | 0 |

**Unregistered flags (from SUMMARY `## Threat Flags`):** None — no Threat Flags sections in plan summaries for this phase.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-14
