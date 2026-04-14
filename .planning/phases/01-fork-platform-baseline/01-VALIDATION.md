---
phase: 1
slug: fork-platform-baseline
status: complete
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-14
updated: 2026-04-14
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^3.x (monorepo projects via root `vitest.config.ts`); Playwright ^1.58 for e2e |
| **Config file** | `vitest.config.ts`, `tests/phase-validation/vitest.config.ts`, `tests/e2e/playwright.config.ts` |
| **Phase contract tests** | `tests/phase-validation/phase-01-fork-baseline.test.ts` |
| **Quick run command** | `pnpm exec vitest run --project phase-validation --config vitest.config.ts` |
| **Full suite command** | `pnpm install --frozen-lockfile && pnpm -r typecheck && pnpm test:run && pnpm build && PAPERCLIP_E2E_SKIP_LLM=true pnpm test:e2e` |
| **Estimated runtime** | ~1s for phase-validation only; ~3–15 minutes for full gates (see `01-VERIFICATION.md`) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test:run` (or scoped package tests if only one workspace changed)
- **After every plan wave:** Run full suite command above
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** Target under 15 minutes on CI; local may vary

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-T1 | 01-01 | 1 | BOOT-01 | T-1-01 / — | frozen lockfile discipline | contract | `pnpm exec vitest run --project phase-validation --config vitest.config.ts` | `phase-01-fork-baseline.test.ts` | ✅ green |
| 01-01-T2 | 01-01 | 1 | BOOT-07 | T-1-03 / — | provenance documented | contract | same | same | ✅ green |
| 01-01-T3 | 01-01 | 1 | BOOT-01 | T-1-05 / — | migrations apply cleanly | manual + script | `pnpm install --frozen-lockfile && pnpm db:migrate` | — | ⚡ manual |
| 01-02-T1 | 01-02 | 2 | BOOT-02 | T-2-02 / — | typecheck real errors | manual | `pnpm -r typecheck` | — | ⚡ manual |
| 01-02-T2 | 01-02 | 2 | BOOT-03 | T-2-02 / — | tests not weakened | manual | `pnpm test:run` | — | ⚡ manual |
| 01-02-T3 | 01-02 | 2 | BOOT-04 | T-2-02 / — | build integrity | manual | `pnpm build` | — | ⚡ manual |
| 01-02-T4 | 01-02 | 2 | BOOT-05 / D-04 | T-2-01 / — | e2e env pattern | manual | `PAPERCLIP_E2E_SKIP_LLM=true pnpm test:e2e` | — | ⚡ manual |
| 01-03-T1 | 01-03 | 3 | QUAL-01 / D-03 / D-04 | T-3-01 / — | branch + gate order | contract | same Vitest project | same | ✅ green |
| 01-03-T2 | 01-03 | 3 | D-03 | T-3-02 / — | workflow parity | contract | same | same | ✅ green |
| 01-03-T3 | 01-03 | 3 | BOOT-07 | T-3-04 / — | CI divergence recorded | contract | same | same | ✅ green |
| 01-04-T1 | 01-04 | 4 | BOOT-06 / QUAL-02 | T-4-01 / — | no accidental publish | contract | same | same | ✅ green |
| 01-04-T2 | 01-04 | 4 | BOOT-06 / D-06 | T-4-03 / — | dry-run on main only | contract | same | same | ✅ green |
| 01-04-T3 | 01-04 | 4 | BOOT-07 / D-07 | T-4-05 / — | dual path + v0.0.1 | contract | same | same | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ⚡ manual (runtime gate; see Manual-Only)*

---

## Wave 0 Requirements

- [x] `tests/phase-validation/phase-01-fork-baseline.test.ts` — repo/CI/release **contract** checks for Phase 1
- [x] `tests/phase-validation/vitest.config.ts` — isolated Vitest project `phase-validation`
- [x] Root `vitest.config.ts` includes `tests/phase-validation`
- [x] Removed stale `tsconfig.json` reference to missing `packages/adapters/droid-local` (restores valid solution graph for tooling)

*Runtime install / migrate / typecheck / full Vitest / build / e2e: use `01-VERIFICATION.md` commands (not nested inside contract tests — avoids Vitest worker timeouts and recursive `pnpm test:run`).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| npm OIDC / GitHub Environments | BOOT-06 publish path | Secrets not in repo | Confirm environment + secret configuration in GitHub UI after workflows land |
| `pnpm db:migrate` exit 0 | BOOT-01 / migrate task | Embedded DB + env | `pnpm install --frozen-lockfile && pnpm db:migrate` |
| Full quality gates (typecheck, full Vitest, build, e2e) | BOOT-02..BOOT-05 | Long-running; nested test:run | Same sequence as `01-VERIFICATION.md` and `semantic-release.yml` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify **or** Wave 0 / manual contract + runtime split documented
- [x] Sampling continuity: contract tests are fast; full gates documented
- [x] Wave 0 covers contract gaps; runtime gates listed under Manual-Only
- [x] No watch-mode flags in automated commands
- [x] Feedback latency: phase-validation &lt; 15s; full gates as in CI
- [ ] `nyquist_compliant: true` — **blocked:** runtime gates remain manual (see table); set when policy accepts contract+manual split

**Approval:** pending

---

## Validation Audit 2026-04-14

| Metric | Count |
|--------|-------|
| Gaps found | 1 (draft VALIDATION + missing contract tests; stale tsconfig reference breaking Vitest) |
| Resolved | 13 contract tests + full VALIDATION map + tsconfig fix |
| Escalated | 0 |
