# Phase 2: Neon Auth - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace **self-hosted Better Auth** with **Neon Auth** (managed Better Auth–compatible) so: users authenticate; **sessions persist** across refresh; **protected APIs** resolve the current user/session consistently; **auth-dependent features** (agents, API tokens, etc.) remain functional. Satisfies **AUTH-01..AUTH-05** and **QUAL-01**. This phase does **not** migrate non-auth app data to Neon Database (Phase 3) or rebrand the product (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Login UI surface

- **D-01 (1a):** **Neon-first** — Prefer Neon’s **documented UI components and integration patterns** where they exist so behavior stays aligned with supported Neon Auth flows and upgrades.
- **D-02 (1b):** **Match current app chrome** — Login/sign-in surfaces should **visually match the existing Paperclip shell** as closely as practical **before** Phase 4 rebrand (not “functional-only” or neutral placeholder styling).
- **D-03 (1c):** **Same-origin routing** — Primary login entry at **`/login`** on the **existing SPA** (same origin as the app). Avoid a separate auth subdomain unless Neon integration **requires** it; if required, document as an explicit exception with rationale.

### Sign-in methods

- **D-04 (2a):** **OAuth-first for `@ciandt.com`** — Primary Epic 1 posture: **Google (or equivalent) OAuth** constrained to **CI&T Google workspace** (`@ciandt.com`). Email/password may exist as secondary or for break-glass only — **Claude’s discretion** during planning/research to match Neon Auth capabilities and least-friction internal rollout.

### Account lifecycle

- **D-05 (3a):** **No public sign-up** — **Disable or block open self-service registration** for this internal deployment. User provisioning is **admin-driven or invite-based** (exact mechanism: planner/researcher to align with Neon Auth + Better Auth options without expanding scope beyond Phase 2).

### Cutover & operations

- **D-06 (4a):** **Feature-flag cutover** — Maintain a **controlled switch** between **legacy (self-hosted) Better Auth** and **Neon Auth** until Phase 2 verification (AUTH-*, QUAL-01) is green in CI and locally; then remove the legacy path in a **follow-up task** within the same phase or explicit cleanup plan. **Do not** silently run dual production modes without documentation.

### Claude's Discretion

- Exact **OAuth provider** configuration (Google workspace restrictions, hosted domain checks) within **D-04**.
- Whether **email/password** remains available for operators and how **invite/admin** flows are implemented **under D-05**, bounded by “no public sign-up.”
- **Feature flag** shape (env var names, default for local dev vs CI) and **removal criteria** for legacy auth.
- Minor styling gaps on Neon-first components vs **D-02** — use tokens/theme alignment without blocking on Phase 4.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & requirements

- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, depends on Phase 1.
- `.planning/REQUIREMENTS.md` — **AUTH-01..AUTH-05**, **QUAL-01** definitions.
- `.planning/PROJECT.md` — Neon Auth + `neon_auth` schema strategy, stack constraints, internal-only product.

### Product

- `projectclip-prd.md` — Epic 1 (Neon Auth), env and migration notes (`neon_auth`, Better Auth 1.4.18 alignment).

### Neon platform (user-mandated)

- `https://neon.com/docs/connect/choose-connection` — Connection strategy when wiring the app to Neon (relevant alongside auth + future DB).
- `https://neon.com/docs/auth/migrate/from-legacy-auth` — Migration path from legacy/self-hosted auth to Neon Auth; align cutover plan (**D-06**) with this guidance.

### Prior phase

- `.planning/phases/01-fork-platform-baseline/01-CONTEXT.md` — Fork/CI baseline decisions; Phase 2 must preserve **QUAL-01** and upstream-aligned CI behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`server/src/auth/better-auth.ts`** — Current self-hosted Better Auth entry; to be replaced or feature-flagged behind Neon Auth per **D-06**.
- **`server/src/agent-auth-jwt.ts`** — Agent JWT path; must remain coherent with session/user resolution after migration (**AUTH-04**).
- **`packages/db`** — Drizzle models for `authUsers`, sessions, accounts, verifications; update to **`neon_auth`** schema strategy per **AUTH-05** when Neon Auth owns tables.

### Established Patterns

- **better-auth 1.4.18** + Drizzle adapter today — Neon Auth is positioned as managed Better Auth–compatible; preserve behavioral parity for protected routes and agents.
- **Cookies / origins** — Driven by `PAPERCLIP_AUTH_PUBLIC_BASE_URL`, `PAPERCLIP_ALLOWED_HOSTNAMES`; Neon migration must preserve secure cookie and CSRF/CORS assumptions.

### Integration Points

- **Express middleware** — Session/user resolution for protected APIs (see codebase map: `server/src/middleware/auth.ts` or equivalent).
- **SPA** — Login route at **`/login`** same origin (**D-03**); Vite/React app must initiate OAuth and session flows consistent with Neon docs.
- **CI** — Workflows must run with feature-flagged Neon Auth (and optionally legacy path for comparison) until **D-06** removal criteria are met.

</code_context>

<specifics>
## Specific Ideas

- **OAuth-first** for **`@ciandt.com`** — Treat Google (workspace) sign-in as the **primary** internal login story for Epic 1.
- **Neon docs** — Planner and researcher must explicitly follow **choose-connection** and **migrate-from-legacy-auth** pages when designing connection strings, branching, and migration steps.

</specifics>

<deferred>
## Deferred Ideas

- **Neon Database** cutover for application data — Phase 3.
- **Rebrand** (Project Clip naming in UI copy) — Phase 4; **D-02** still requires matching **current** Paperclip chrome until then.
- **Additional IdPs** beyond Google/`@ciandt.com` — future milestone unless required by AUTH-01 in a later PRD revision.

</deferred>

---

*Phase: 02-neon-auth*
*Context gathered: 2026-04-14*
