---
phase: 02-neon-auth
plan: 01
subsystem: auth
tags: [neon-auth, better-auth, express, jwt, session, feature-flag, proxy]

# Dependency graph
requires:
  - phase: 01-fork-platform-baseline
    provides: Express server with actorMiddleware, Better Auth handler, QUAL-01 baseline
provides:
  - createNeonAuthProxyHandler() mounted at /api/auth/* when PAPERCLIP_AUTH_PROVIDER=neon
  - resolveNeonAuthSession() as drop-in for actorMiddleware resolveSession
  - NeonAuthSessionResult type
  - Feature flag PAPERCLIP_AUTH_PROVIDER controls auth path switching
  - Agent JWT path (source: agent_jwt) confirmed unaffected by Neon Auth session resolver
affects:
  - 02-neon-auth/02-02 (schema update — uses AuthSessionResult type from middleware/auth.ts)
  - 02-neon-auth/02-03 (SPA auth client — proxied by createNeonAuthProxyHandler)
  - 02-neon-auth/02-04 (cleanup — removes PAPERCLIP_AUTH_PROVIDER=better-auth legacy path)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Neon Auth session validation via GET {NEON_AUTH_BASE_URL}/api/auth/get-session with Cookie forwarding"
    - "Feature flag via PAPERCLIP_AUTH_PROVIDER env var with default=better-auth for safe cutover"
    - "D-05 API gate: block POST /api/auth/sign-up/email with 403 in Express proxy (no public signup)"
    - "AuthSessionResult shared type in middleware/auth.ts replaces BetterAuthSessionResult as parameter type"
    - "TDD: RED commit (test) → GREEN commit (feat) for Neon Auth core module"

key-files:
  created:
    - server/src/auth/neon-auth.ts
    - server/src/__tests__/neon-auth.test.ts
    - server/src/__tests__/agent-auth-passthrough.test.ts
  modified:
    - server/src/middleware/auth.ts
    - server/src/app.ts
    - server/src/index.ts
    - .env.example
    - FORK_DIFF.md

key-decisions:
  - "Used native globalThis.fetch (Node 18+) instead of node-fetch — avoids new dependency"
  - "AuthSessionResult type introduced in middleware/auth.ts to accept both BetterAuth and Neon Auth without circular imports"
  - "app.ts feature flag reads PAPERCLIP_AUTH_PROVIDER at request time (not startup) to allow dynamic routing in test environments"
  - "Worktree node_modules symlinked to main repo server/node_modules for test execution (worktrees share pnpm lockfile)"

patterns-established:
  - "Neon Auth proxy pattern: forward Cookie header, strip upstream error bodies (T-02-05), block sign-up endpoint (T-02-02)"
  - "actorMiddleware resolveSession is injectable — drop-in replacement requires no downstream logic changes"

requirements-completed: [AUTH-01, AUTH-03, AUTH-04]

# Metrics
duration: 25min
completed: 2026-04-14
---

# Phase 02 Plan 01: Neon Auth Server Infrastructure Summary

**Express proxy handler and session resolver for Neon Auth REST API, feature-flagged behind PAPERCLIP_AUTH_PROVIDER with agent JWT path confirmed unaffected**

## Performance

- **Duration:** 25 min
- **Started:** 2026-04-14T15:47:58Z
- **Completed:** 2026-04-14T16:12:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Implemented `server/src/auth/neon-auth.ts` with `createNeonAuthProxyHandler()` and `resolveNeonAuthSession()` — 6 unit tests green
- Wired `PAPERCLIP_AUTH_PROVIDER` feature flag in `app.ts` and `index.ts`: `=neon` activates Neon Auth proxy; `=better-auth` (default) preserves legacy path
- Broadened `actorMiddleware` to accept `AuthSessionResult` (compatible with both auth providers) and confirmed agent JWT path is unaffected with 3 passing tests

## Task Commits

1. **Task 1 RED: Failing tests for neon-auth** - `357245f` (test)
2. **Task 1 GREEN: Implement Neon Auth proxy handler and session resolver** - `5e541f1` (feat)
3. **Task 2: Wire feature flag in app.ts + index.ts; update middleware and env docs** - `202570b` (feat)
4. **Task 3: Verify agent JWT path is unaffected** - `83fda3c` (test)

## Files Created/Modified

- `server/src/auth/neon-auth.ts` — NEW: `NeonAuthSessionResult` type, `resolveNeonAuthSession()`, `createNeonAuthProxyHandler()` with D-05 sign-up block and T-02-05 error stripping
- `server/src/__tests__/neon-auth.test.ts` — 6 unit tests covering session resolution (200, 401, network error, missing env) and proxy handler (GET forwarding, POST 403 block)
- `server/src/__tests__/agent-auth-passthrough.test.ts` — 3 tests confirming Bearer JWT short-circuits before session resolution (AUTH-04)
- `server/src/middleware/auth.ts` — Introduced `AuthSessionResult` exported type; `ActorMiddlewareOptions.resolveSession` broadened to accept both auth providers
- `server/src/app.ts` — Feature-flag block at auth route mount; `resolveSession` parameter typed as `AuthSessionResult`
- `server/src/index.ts` — Feature flag reads `PAPERCLIP_AUTH_PROVIDER`, logs at startup, conditionally imports `resolveNeonAuthSession` or builds Better Auth instance
- `.env.example` — Added `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `PAPERCLIP_AUTH_PROVIDER` vars with comments
- `FORK_DIFF.md` — Added Phase 2 Neon Auth divergence entry

## Decisions Made

- Used `globalThis.fetch` (Node 18+ native) instead of adding `node-fetch` dependency — keeps the module lightweight and avoids version pinning.
- Introduced `AuthSessionResult` type in `middleware/auth.ts` rather than importing from `neon-auth.ts` — avoids circular imports and gives middleware a neutral shape that both providers satisfy.
- Feature flag evaluated at request time in `app.ts` (not only at startup in `index.ts`) — ensures test environments can switch auth providers without server restart in tests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Introduced AuthSessionResult shared type**
- **Found during:** Task 2 (updating middleware/auth.ts)
- **Issue:** `ActorMiddlewareOptions.resolveSession` was typed as `Promise<BetterAuthSessionResult | null>` — would produce TypeScript errors when assigning `resolveNeonAuthSession` which returns `NeonAuthSessionResult | null`
- **Fix:** Introduced `AuthSessionResult` as the common parameter type in `middleware/auth.ts`; updated `index.ts` to declare `resolveSession` with the broader type; removed direct import of `BetterAuthSessionResult` from `middleware/auth.ts`
- **Files modified:** server/src/middleware/auth.ts, server/src/index.ts, server/src/app.ts
- **Verification:** `npx tsc --noEmit` shows no new type errors introduced by our changes
- **Committed in:** 202570b (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing critical type correctness)
**Impact on plan:** Essential for TypeScript correctness when both auth providers are accepted. No scope creep.

## Issues Encountered

- Worktree `server/node_modules` was empty (only `.vite` cache). Tests run from `server` directory without the full pnpm dependency tree. Resolved by symlinking `server/node_modules` → main repo's `server/node_modules` (same pnpm lockfile). This is a worktree execution pattern, not a code issue.
- Pre-existing TypeScript errors (`Property 'actor' does not exist on type 'Request'`) from missing `types/express.d.ts` — this file was added in commit `1af58e5` which is newer than our base `8f8c2d6`. These errors are not introduced by this plan.

## User Setup Required

External services require manual configuration before activating `PAPERCLIP_AUTH_PROVIDER=neon`:

1. Enable Neon Auth on your Neon project: Neon Console → Your Project → Auth → Enable
2. Get `NEON_AUTH_BASE_URL`: Neon Console → Your Project → Auth → Overview → 'Auth API URL'
3. Generate `NEON_AUTH_COOKIE_SECRET`: `openssl rand -base64 32`
4. Set `PAPERCLIP_AUTH_PROVIDER=neon` in your `.env` to activate the Neon Auth path

Leave `PAPERCLIP_AUTH_PROVIDER=better-auth` (default) to continue using the legacy path.

## Next Phase Readiness

- Server-side Neon Auth proxy is complete and tested
- `actorMiddleware` accepts `resolveNeonAuthSession` as drop-in with correct types
- Agent JWT path (AUTH-04) confirmed unaffected
- Ready for: 02-02 (schema/DB FK audit), 02-03 (SPA auth client with Neon Auth SDK)
- Concern: The `resolveSessionFromHeaders` used by WebSocket server (`setupLiveEventsWebSocketServer`) is still typed to `BetterAuthSessionResult` in `index.ts` — this path is not switched to Neon Auth in plan 02-01. The WebSocket session resolution will need updating in plan 02-03 or 02-04.

---
*Phase: 02-neon-auth*
*Completed: 2026-04-14*
