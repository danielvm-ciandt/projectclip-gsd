# CONCERNS.md — Technical Debt and Issues

## Severity Legend
- **CRITICAL** — Security risk or production failure risk
- **HIGH** — Significant maintainability or reliability problem
- **MEDIUM** — Notable debt that will slow future development
- **LOW** — Minor issues, style, or future-proofing gaps

---

## Critical

### C1: `local_trusted` Mode Grants Full Admin Bypass
**File:** Server auth middleware (18 call sites reference `isInstanceAdmin` via `local_trusted`)
**Issue:** When `local_trusted` mode is active, all requests receive `isInstanceAdmin = true`. If a production deployment misconfigures this mode (e.g., environment variable set incorrectly), the entire API is open to any caller without authentication.
**Risk:** Full privilege escalation in misconfigured networked deployments.
**Action:** Add explicit guard that `local_trusted` only activates on loopback interface or when `NODE_ENV !== 'production'`.

---

## High

### H1: God Files — Extreme Single-File Complexity
**Files:**
- `server/src/services/heartbeat.ts` — **4,707 lines, 93 functions**
- `ui/src/pages/AgentDetail.tsx` — **4,120 lines, 32 `useEffect` hooks**

**Issue:** Both files violate SRP severely. `heartbeat.ts` mixes scheduling, state management, DB access, external API calls, and business logic. `AgentDetail.tsx` mixes data fetching, UI rendering, event handling, and business logic in one component.
**Risk:** High bug surface, untestable units, merge conflicts, cognitive overload.
**Action:** Extract into focused service modules / sub-components. Priority: `heartbeat.ts` first (server-side risk).

### H2: 116 Silent `catch {}` Blocks
**Location:** `server/src/` — 116 occurrences of empty or logging-free catch blocks
**Issue:** Errors are swallowed with no logging. Production failures become invisible — the system silently degrades.
**Risk:** Impossible to diagnose production issues; data loss goes undetected.
**Action:** Audit all catch blocks. At minimum add `log.error({ err }, 'context message')`. Remove empty catches entirely.

### H3: In-Memory Concurrency Locks Won't Survive Restart or Scale-Out
**Location:** `server/src/` — `startLocksByAgent` and `skillInventoryRefreshPromises` are module-level `Map` instances
**Issue:** Locks are process-local. On restart, all in-flight locks are lost (leaving agents in indeterminate state). In a multi-process or clustered deployment, locks are not shared.
**Risk:** Agent double-starts, race conditions, data corruption under load or failover.
**Action:** Replace module-level Maps with DB-backed advisory locks (Postgres `pg_try_advisory_lock`) or a distributed lock mechanism.

### H4: No HTTP-Level Rate Limiting
**Location:** All API routes in `server/src/routes/`
**Issue:** No rate limiting middleware on any endpoint. Only the plugin secrets handler has an in-process limiter.
**Risk:** API abuse, DoS via request flooding, credential stuffing on auth endpoints.
**Action:** Add `express-rate-limit` globally with stricter limits on auth and sensitive endpoints.

### H5: `spawnSync` Blocks the Event Loop
**File:** `server/src/` — `cursor-models.ts`
**Issue:** `spawnSync` is a synchronous subprocess call that fully blocks the Node.js event loop until the child process exits.
**Risk:** Under any load, this will stall all concurrent requests for the duration of the subprocess.
**Action:** Replace with `spawn` + promise wrapper or use `execa` for async subprocess management.

---

## Medium

### M1: 10 Suppressed `react-hooks/exhaustive-deps` in Production UI
**Location:** `ui/src/` — 10 `// eslint-disable-next-line react-hooks/exhaustive-deps` in production files
**Issue:** Each suppressed warning is a potential stale closure bug where a hook captures an outdated value.
**Risk:** Subtle UI bugs that are hard to reproduce — stale data, missed re-renders, incorrect behavior after state changes.
**Action:** Audit each suppression. Fix by adding missing deps, using `useCallback`/`useMemo`, or refactoring the effect.

### M2: Significant Test Coverage Gaps
**Untested services:** `goals.ts`, `finance.ts`, `dashboard.ts`, `live-events.ts`, `access.ts`
**UI file coverage:** ~21%
**Issue:** Core business logic services have zero unit tests. UI is largely untested at the component level.
**Risk:** Regressions go undetected; refactoring is unsafe.
**Action:** Prioritize test coverage for untested services, especially `finance.ts` and `access.ts` (high business value / security relevance).

### M3: No Coverage Thresholds Enforced
**Location:** All `vitest.config.ts` files
**Issue:** Coverage is opt-in with no enforced minimums. The test suite can regress silently.
**Action:** Add `coverage.thresholds` to vitest configs. Start at current coverage level to prevent regression.

### M4: `AgentDetail.tsx` Has 32 `useEffect` Hooks
**File:** `ui/src/pages/AgentDetail.tsx`
**Issue:** 32 effects in one component is a maintenance anti-pattern. Effects are hard to reason about in isolation; ordering and dependency interactions create subtle bugs.
**Risk:** Hard-to-trace re-render loops, stale state, and memory leaks.
**Action:** Decompose into sub-components and custom hooks. Each hook should own one concern.

---

## Low

### L1: No ESLint or Prettier Config at Repo Root
**Issue:** Code style is enforced only through TypeScript strict mode and convention. No automated formatting check in CI.
**Risk:** Inconsistent style accumulates over time, especially as contributors change.
**Action:** Add `eslint.config.js` + Prettier config; wire into CI pre-commit or lint step.

### L2: No Enforced Import Order Linting
**Issue:** Import ordering convention (builtins → third-party → workspace → relative) is documented but not automatically enforced.
**Action:** Add `eslint-plugin-import` with `import/order` rule to enforce the convention.

### L3: Missing `node:` Protocol Prefix on Built-in Imports
**Issue:** Some files import `fs`, `path`, etc. without the `node:` prefix, which is now the recommended convention for ESM Node.js.
**Action:** Add lint rule `unicorn/prefer-node-protocol` or fix manually.

---

## Fragile Areas

| Area | Reason |
|------|--------|
| `server/src/services/heartbeat.ts` | 4,707 lines; any change risks unexpected side effects |
| `ui/src/pages/AgentDetail.tsx` | 4,120 lines, 32 effects; very high regression risk |
| Auth middleware (`local_trusted`) | Security-critical; misconfiguration has total impact |
| In-memory agent locks | State lost on any process restart |
| All services without tests | `goals`, `finance`, `dashboard`, `live-events`, `access` — blind spots |
