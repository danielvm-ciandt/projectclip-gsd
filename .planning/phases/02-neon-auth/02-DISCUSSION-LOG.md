# Phase 2: Neon Auth - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `02-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 2 — Neon Auth
**Areas discussed:** Login UI surface, Sign-in methods, Account lifecycle, Cutover vs fallback

---

## Area 1 — Login UI surface

| Topic | User choice |
|-------|-------------|
| Implementation style | **Neon-first** (Neon documented UI/components where available) |
| Look before Phase 4 rebrand | **A** — Match current app chrome |
| Routing | **Same-origin** `/login` on the SPA |

**Notes:** User prioritized supported Neon patterns while keeping visual parity with existing shell.

---

## Area 2 — Sign-in methods

| Topic | User choice |
|-------|-------------|
| Epic 1 launch | **OAuth-first** for **`@ciandt.com`** (CI&T Google workspace) |

**Notes:** Secondary email/password or break-glass left to planning (see CONTEXT Claude's Discretion).

---

## Area 3 — Account lifecycle

| Topic | User choice |
|-------|-------------|
| Account creation | **No public sign-up** |

**Notes:** Admin or invite flows to be specified in planning without expanding phase scope.

---

## Area 4 — Cutover vs fallback

| Topic | User choice |
|-------|-------------|
| Self-hosted vs Neon | **Feature flag** — retain path to legacy self-hosted Better Auth until verification green |

**Mandatory refs (user-supplied):**

- `https://neon.com/docs/connect/choose-connection`
- `https://neon.com/docs/auth/migrate/from-legacy-auth`

---

## Claude's Discretion

- OAuth provider details and workspace restriction mechanics under OAuth-first.
- Invite/admin provisioning details under no public sign-up.
- Feature flag implementation and removal criteria.

## Deferred Ideas

- Captured in `02-CONTEXT.md` `<deferred>` (Phases 3–4, extra IdPs).
