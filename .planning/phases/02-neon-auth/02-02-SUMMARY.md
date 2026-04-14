---
phase: 02-neon-auth
plan: "02"
subsystem: database
tags: [drizzle, neon-auth, postgres, schema, fk-constraints]

# Dependency graph
requires:
  - phase: 02-neon-auth/02-01
    provides: Neon Auth proxy handler and session resolver (neon-auth.ts)
provides:
  - Drizzle schema aligned with neon_auth strategy — authUsers references neon_auth.users_sync
  - board_api_keys and cli_auth_challenges have no Drizzle FK constraints to authUsers
  - FORK_DIFF.md documents schema divergence for AUTH-05
affects:
  - 02-03-neon-auth (SPA auth client — depends on authUsers shape for session user joins)
  - 02-04-neon-auth (verification/cleanup — confirms schema strategy holds)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "pgSchema('neon_auth') for cross-schema table references to Neon Auth managed tables"
    - "Plain text userId columns (no Drizzle FK) when user identity is validated at application layer via session middleware"

key-files:
  created: []
  modified:
    - packages/db/src/schema/auth.ts
    - packages/db/src/schema/board_api_keys.ts
    - packages/db/src/schema/cli_auth_challenges.ts
    - FORK_DIFF.md

key-decisions:
  - "Used Option A (keep exports, point to neon_auth schema) for authUsers since server/src/index.ts, routes/access.ts, and services/board-auth.ts all perform Drizzle joins against authUsers — removing the export would break 3 downstream consumers"
  - "authSessions/authAccounts/authVerifications retained in public schema for legacy better-auth path; clearly marked as not used when PAPERCLIP_AUTH_PROVIDER=neon"
  - "board_api_keys.userId and cli_auth_challenges.approvedByUserId changed from FK references to plain text — application-layer session validation (actorMiddleware) enforces user identity per ASVS L1 V4.1"

patterns-established:
  - "Cross-schema Drizzle reference pattern: pgSchema('neon_auth').table('users_sync', {...}) for Neon Auth managed tables"
  - "FK-removal pattern: replace .references(() => authUsers.id) with plain text column + comment explaining AUTH-05 enforcement boundary"

requirements-completed:
  - AUTH-05

# Metrics
duration: 15min
completed: 2026-04-14
---

# Phase 02 Plan 02: Drizzle Schema Neon Auth Strategy Summary

**Drizzle auth schema updated so authUsers references neon_auth.users_sync via pgSchema and FK constraints on board_api_keys.userId and cli_auth_challenges.approvedByUserId are removed, aligning with Neon Auth ownership (AUTH-05)**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-14T16:15:00Z
- **Completed:** 2026-04-14T16:31:40Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `packages/db/src/schema/auth.ts` updated to use `pgSchema("neon_auth")` so `authUsers` maps to `neon_auth.users_sync` — Drizzle no longer owns this table in migration mode
- `board_api_keys.ts` and `cli_auth_challenges.ts` FK constraints to `authUsers.id` removed; userId columns become plain text with application-layer validation boundary documented in code
- `FORK_DIFF.md` updated with AUTH-05 schema strategy change section
- `pnpm -r typecheck` passes with zero errors across all 21 workspace projects

## Task Commits

Each task was committed atomically:

1. **Task 1: Audit and update auth.ts — mark tables for neon_auth ownership** - `5dcc50a` (feat)
2. **Task 2: Remove FK constraints from board_api_keys and cli_auth_challenges** - `3df5acc` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `packages/db/src/schema/auth.ts` — authUsers now references neon_auth.users_sync via pgSchema; authSessions/authAccounts/authVerifications retained for legacy better-auth path with internal FK references removed
- `packages/db/src/schema/board_api_keys.ts` — userId changed from `.references(() => authUsers.id)` to plain text; authUsers import removed
- `packages/db/src/schema/cli_auth_challenges.ts` — approvedByUserId changed from `.references(() => authUsers.id)` to plain text; authUsers import removed
- `FORK_DIFF.md` — added "Schema strategy change (AUTH-05)" section under Phase 2

## Decisions Made

- **Option A over Option B for authUsers:** `server/src/index.ts`, `routes/access.ts`, and `services/board-auth.ts` all import `authUsers` for Drizzle join queries (selecting email, name). Removing the export would break these consumers, so we kept the export but changed its schema target to `neon_auth.users_sync`.
- **Retained legacy auth tables (sessions/accounts/verifications):** These are still used by `server/src/auth/better-auth.ts` for the legacy cutover path. Removing them would break the feature flag fallback path. They are clearly annotated as legacy and not used when Neon Auth is active.
- **Removed internal FK in legacy tables:** `authSessions.userId` previously referenced `authUsers.id` which is now in `neon_auth` schema — this cross-schema FK would be invalid. Removed it to keep legacy table definitions clean.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed cross-schema FK in legacy authSessions and authAccounts**
- **Found during:** Task 1 (auth.ts update)
- **Issue:** The original `authSessions.userId` and `authAccounts.userId` had `.references(() => authUsers.id)`. After moving `authUsers` to `neon_auth` schema, these became cross-schema FK references that would be invalid in Drizzle/Postgres
- **Fix:** Removed `.references()` calls from `authSessions.userId` and `authAccounts.userId` in the legacy table definitions
- **Files modified:** `packages/db/src/schema/auth.ts`
- **Verification:** `pnpm -r typecheck` passes; no cross-schema FK references remain
- **Committed in:** `5dcc50a` (Task 1 commit)

**2. [Rule 1 - Bug] Removed unused `boolean` import**
- **Found during:** Task 1 (auth.ts update)
- **Issue:** `boolean` was imported but no longer used after removing `emailVerified` field from `authUsers` (which now reflects the neon_auth.users_sync schema that does not have emailVerified)
- **Fix:** Removed `boolean` from the import statement
- **Files modified:** `packages/db/src/schema/auth.ts`
- **Committed in:** `5dcc50a` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

None — plan executed cleanly. All typecheck runs passed with zero errors.

## User Setup Required

None - no external service configuration required. These are schema-only changes; no migration is needed (FK constraints are only enforced in the Drizzle schema layer, not via new migration files).

## Next Phase Readiness

- Schema is aligned with Neon Auth strategy — `authUsers` can be used in joins against `neon_auth.users_sync`
- `board_api_keys` and `cli_auth_challenges` user ID columns are now compatible with Neon Auth user IDs (no FK enforcement requiring public schema)
- Ready for Plan 02-03 (SPA auth client) which will wire the Neon Auth client in the React UI

---
*Phase: 02-neon-auth*
*Completed: 2026-04-14*
