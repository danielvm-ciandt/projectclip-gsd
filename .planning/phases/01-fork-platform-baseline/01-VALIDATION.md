---
phase: 1
slug: fork-platform-baseline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^3.x (monorepo projects via root `vitest.config.ts`); Playwright ^1.58 for e2e |
| **Config file** | `vitest.config.ts`, `tests/e2e/playwright.config.ts` (post-import paths) |
| **Quick run command** | `pnpm test:run` |
| **Full suite command** | `pnpm install --frozen-lockfile && pnpm -r typecheck && pnpm test:run && pnpm build && pnpm test:e2e` |
| **Estimated runtime** | ~3–15 minutes (depends on e2e; CI uses Chromium + app boot) |

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
| TBD | TBD | TBD | BOOT-02..BOOT-05 | T-1-01 / — | N/A | unit+e2e | `pnpm test:run` / `pnpm test:e2e` | ⬜ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `semantic-release` config + `main`-branch dry-run job (BOOT-06 / D-06) — not present in upstream Paperclip
- [ ] Default branch + workflow triggers aligned (`main` vs `master`) documented in `FORK_DIFF.md`
- [ ] Release workflow lockfile policy aligned with QUAL-01 or documented exception

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| npm OIDC / GitHub Environments | BOOT-06 publish path | Secrets not in repo | Confirm environment + secret configuration in GitHub UI after workflows land |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15m on CI where possible
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
