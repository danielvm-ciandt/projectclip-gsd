# Phase 2: Neon Auth — Research

**Researched:** 2026-04-14  
**Phase:** 02 — Neon Auth  
**Goal:** Replace self-hosted Better Auth with Neon Auth; login works; sessions stable for API and agents.

---

## Summary

Neon Auth is a **managed Better Auth 1.4.18–compatible service** backed by your Neon database's `neon_auth` schema. The migration replaces `createBetterAuthInstance` (in `server/src/auth/better-auth.ts`) with Neon Auth's REST API service, switches the SPA auth client from bare fetch calls to `@neondatabase/auth/next`, and reroutes the login page from `/auth` to `/login` with a `/auth` redirect. The agent JWT path (`server/src/agent-auth-jwt.ts`) uses its own HMAC secret and is **unaffected** — it does not touch the Better Auth session layer.

The key architectural difference: Neon Auth runs as an **off-process managed REST API** — no `drizzleAdapter`, no `betterAuth()` constructor, no `toNodeHandler`. The Express server proxies auth requests to the Neon Auth service URL. Session validation on the server reads the session cookie by calling the Neon Auth REST endpoint.

---

## 1. SDK and Integration Pattern

### Server (Express — not Next.js)

This is **not** a Next.js app. The server is **Express**. The Neon Auth Next.js SDK (`@neondatabase/auth/next/server`) provides `createNeonAuth` with `auth.handler()` and `auth.middleware()` designed for Next.js App Router — **these do not apply directly**.

**What applies instead:**
- Install `@neondatabase/auth` (base package)
- The Neon Auth service exposes a REST API at `NEON_AUTH_BASE_URL`
- Session validation: call `GET {NEON_AUTH_BASE_URL}/api/auth/get-session` forwarding the session cookie header
- Auth route proxy: mount Express routes that forward to `{NEON_AUTH_BASE_URL}/api/auth/*`
- The `@neondatabase/auth` package includes a client (`createAuthClient`) for React/Vite — use this in the SPA

**Current Express wiring to replace:**
```
server/src/auth/better-auth.ts
  → createBetterAuthInstance()      // creates betterAuth() with drizzleAdapter
  → createBetterAuthHandler()       // toNodeHandler(auth) → Express RequestHandler
  → resolveBetterAuthSession()      // auth.api.getSession() for session resolution

server/src/app.ts
  → app.all("/api/auth/{*authPath}", betterAuthHandler)
  → actorMiddleware(db, { resolveSession })

server/src/index.ts  (lines ~461–500)
  → feature-flag guard creates betterAuth or skips it
```

**Replacement pattern:**
```typescript
// New: server/src/auth/neon-auth.ts
import fetch from "node-fetch"; // or native fetch in Node 18+

const NEON_AUTH_BASE_URL = process.env.NEON_AUTH_BASE_URL;

export function createNeonAuthProxyHandler(): RequestHandler {
  return async (req, res) => {
    // Forward to Neon Auth service: {NEON_AUTH_BASE_URL}/api/auth/{path}
    // Pass cookies and body through, return response
  };
}

export async function resolveNeonAuthSession(req: Request): Promise<SessionResult | null> {
  // GET {NEON_AUTH_BASE_URL}/api/auth/get-session
  // Forward cookie header from req.headers
}
```

### SPA (Vite/React)

The SPA currently uses bare `fetch()` calls in `ui/src/api/auth.ts` to `/api/auth/*`. These are proxied by the Express server.

**Options:**
1. **Keep bare fetch** — Since the SPA already posts to `/api/auth/sign-in/email`, `/api/auth/sign-up/email`, etc., and the Express proxy forwards to Neon Auth's REST API, the existing `authApi` in `ui/src/api/auth.ts` **may continue to work with no changes** if the Neon Auth REST API endpoints are compatible (same paths).
2. **Use `@neondatabase/auth` client** — `createAuthClient()` from `@neondatabase/auth/next` provides `signIn.email()`, `signIn.social()`, `getSession()` etc. This is cleaner for OAuth support (D-04).

**Recommendation:** For OAuth (Google sign-in, D-04), the `authClient.signIn.social({ provider: "google" })` call is needed — bare fetch cannot initiate OAuth redirects. Replace `ui/src/api/auth.ts` with `createAuthClient`.

---

## 2. OAuth: Google Workspace Restriction (D-04)

Neon Auth supports Google OAuth out of the box in development mode using **shared credentials** (no configuration needed for dev/testing).

For production (`@ciandt.com` restriction):
1. Create a Google OAuth app in Google Cloud Console
2. Configure OAuth in Neon Console → **Settings → Auth → OAuth**
3. **Hosted domain restriction**: Use `hd=ciandt.com` in the OAuth consent screen, or validate `hd` claim in the JWT after sign-in
4. Neon Auth does not natively filter by hosted domain — must implement post-auth validation: after `signIn.social()` succeeds, check `session.user.email` ends in `@ciandt.com`; if not, sign out and return error

**Dev convenience**: Shared dev credentials mean local development works immediately without Google OAuth app setup.

---

## 3. Disabling Public Sign-up (D-05)

Neon Auth does not yet support built-in signup restrictions (per docs: "Anyone can sign up for your application by default. Support for restricted signups is coming soon.").

**Mitigations:**
- **UI gate**: Remove sign-up form from `Auth.tsx`; the existing `disableSignUp` config concept maps to hiding the UI (UI-SPEC D-05 already specifies removing "Need an account?" toggle)
- **API gate**: In the Express auth proxy handler, intercept `POST /api/auth/sign-up/email` and return `403 Forbidden` unless called from an admin-provisioning context
- **Email verification**: Enable email verification (docs recommend this since signup is open) — but this adds friction; for internal use the API-gate approach is simpler

---

## 4. Feature Flag Cutover (D-06)

**Current state**: `server/src/index.ts` lines ~461–500 already shows conditional logic around `betterAuthHandler`. The feature flag pattern is:

```typescript
// Proposed env var shape (Claude's discretion):
// PAPERCLIP_AUTH_PROVIDER=neon|better-auth  (default: better-auth during cutover)
```

**Cutover plan**:
- `PAPERCLIP_AUTH_PROVIDER=better-auth` → existing path (no change)
- `PAPERCLIP_AUTH_PROVIDER=neon` → new Neon Auth proxy path
- Remove legacy path once AUTH-* + QUAL-01 green in CI

**Key risk**: During cutover, sessions issued by legacy Better Auth are not valid in Neon Auth (different signing keys, different `neon_auth` schema). Users will need to re-authenticate when switching.

---

## 5. Schema Strategy (AUTH-05)

**Current Drizzle schema** (`packages/db/src/schema/auth.ts`):
```
authUsers    → pgTable("user", ...)
authSessions → pgTable("session", ...)
authAccounts → pgTable("account", ...)
authVerifications → pgTable("verification", ...)
```
These tables are in the `public` schema.

**Neon Auth schema**: Neon Auth owns its own tables under the `neon_auth` schema:
```
neon_auth.user
neon_auth.session  
neon_auth.account
neon_auth.verification
```

**Impact**:
- When Neon Auth is active, these tables are **created and managed by Neon**, not by Drizzle migrations
- The Drizzle adapter configuration in `better-auth.ts` is removed
- Any code in `packages/db` that imports `authUsers`, `authSessions` etc. for Drizzle joins with other tables needs updating
- Cross-schema references: `board_api_keys.userId` references `authUsers.id` — must verify this still works when user IDs come from `neon_auth.user`
- CLI auth (`cli_auth_challenges.approvedByUserId`) similarly references `authUsers.id`

**AUTH-05 scope**: Update Drizzle references so they either read from `neon_auth.user` (via cross-schema reference) or rely only on the user ID string value (no FK join).

---

## 6. Session Resolution in Express Middleware

The `actorMiddleware` in `server/src/middleware/auth.ts` calls `opts.resolveSession(req)` to get `{ session, user }`. This interface is already abstracted:

```typescript
interface ActorMiddlewareOptions {
  resolveSession?: (req: Request) => Promise<BetterAuthSessionResult | null>;
}
```

**Migration**: Replace `BetterAuthSessionResult` type with a shared `AuthSessionResult` type. Implement `resolveNeonAuthSession(req)` that:
1. Extracts the `Cookie` header from `req`
2. Makes a GET to `{NEON_AUTH_BASE_URL}/api/auth/get-session` forwarding cookies
3. Returns `{ session: { id, userId }, user: { id, email, name } }` matching the existing shape

This is a **drop-in replacement** — the rest of `actorMiddleware` does not change.

---

## 7. Route Changes (UI-SPEC D-03)

**Current**: Auth page at `/auth` route in `App.tsx:314`
**Required**: Primary entry at `/login`; `/auth` redirects to `/login`

```tsx
// App.tsx changes:
<Route path="auth" element={<Navigate to="/login" replace />} />  // redirect
<Route path="login" element={<AuthPage />} />                      // new canonical

// Unauthenticated guard (App.tsx:115):
return <Navigate to={`/login?next=${next}`} replace />;            // was /auth
```

---

## 8. Env Vars Required

```bash
# Neon Auth
NEON_AUTH_BASE_URL=https://ep-xxx.neonauth.us-east-1.aws.neon.tech/neondb/auth
NEON_AUTH_COOKIE_SECRET=<openssl rand -base64 32>   # 32+ chars

# Feature flag (D-06)
PAPERCLIP_AUTH_PROVIDER=neon  # or better-auth (default during cutover)

# Google OAuth (production, D-04)
# Configured in Neon Console → Settings → Auth → OAuth (no env var in app)
```

---

## 9. Agent JWT (AUTH-04) — Unaffected

`server/src/agent-auth-jwt.ts` uses `PAPERCLIP_AGENT_JWT_SECRET` / `BETTER_AUTH_SECRET` for HMAC-HS256 JWTs. This path is **entirely independent** of the auth provider — it does not call Better Auth session APIs. The `actorMiddleware` handles agent bearer tokens via `verifyLocalAgentJwt()` before session resolution is even attempted.

**No changes needed** to `agent-auth-jwt.ts`. The only change: `BETTER_AUTH_SECRET` env var may be renamed to `PAPERCLIP_AGENT_JWT_SECRET` explicitly (it already falls back), but this is optional cleanup.

---

## 10. Dependencies

| Package | Action |
|---------|--------|
| `better-auth` | Keep during cutover; remove after D-06 flag removed |
| `better-auth/adapters/drizzle` | Keep during cutover; remove after |
| `@neondatabase/auth` | **Add** to both `server` and `ui` packages |

---

## 11. Known Risks / Open Questions

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Neon Auth Beta status | Medium | Neon Auth is in Beta — acceptable for internal deployment; document in FORK_DIFF.md |
| Cross-schema Drizzle FK references | High | `board_api_keys` and `cli_auth_challenges` reference `authUsers.id` FK — must audit and update to string-only or cross-schema reference |
| Session cookie domain | Medium | Neon Auth sets `__Secure-neonauth.session_token`; Express proxy must forward cookies correctly without stripping them |
| OAuth domain restriction | Medium | No native `@ciandt.com` filter in Neon Auth — must implement post-sign-in email check |
| Dev-to-prod session continuity | Low | Users re-auth on cutover; acceptable for internal beta |
| Safari localhost HTTPS | Low | Use `npm run dev -- --experimental-https` for Safari during dev |

---

## 12. Plan Shape Recommendation

Based on the above, Phase 2 likely needs **3–4 plans**:

1. **02-01**: Server-side Neon Auth proxy — replace `better-auth.ts`, implement `neon-auth.ts`, feature flag in `index.ts`, update `actorMiddleware` interface
2. **02-02**: Schema update — remove Drizzle auth tables from Neon Auth scope, audit FK references in `board_api_keys`, `cli_auth_challenges`, update `packages/db`
3. **02-03**: SPA auth client — replace `ui/src/api/auth.ts` with `createAuthClient`, update `Auth.tsx` for Google OAuth + domain check + no sign-up, add `/login` route + `/auth` redirect
4. **02-04**: Verification + cleanup — `QUAL-01` CI passes with Neon Auth flag, remove legacy feature flag, production checklist items (trusted domains, OAuth credentials)

---

## Validation Architecture

### Test Dimensions

| Dimension | Approach |
|-----------|----------|
| Unit | `resolveNeonAuthSession()` with mocked fetch; domain-check logic |
| Integration | `actorMiddleware` with real session cookie → user resolution |
| E2E | Sign-in via Google OAuth (mocked) or email/password in Playwright |

### Critical Verification Points

- `AUTH-01`: `POST /api/auth/sign-in/email` returns session cookie; `GET /api/auth/get-session` resolves user
- `AUTH-02`: Browser refresh — cookie persists; `authApi.getSession()` returns user
- `AUTH-03`: Protected API route with valid session → `req.actor.userId` populated
- `AUTH-04`: Agent JWT path (`Authorization: Bearer <jwt>`) resolves `req.actor.type === "agent"` unchanged
- `AUTH-05`: `board_api_keys` and `cli_auth_challenges` FKs resolve correctly with `neon_auth` user IDs

---

## ## RESEARCH COMPLETE

All five requirement areas (AUTH-01..AUTH-05, QUAL-01) researched. Key findings:
- Express proxy pattern (not Next.js middleware) required
- `actorMiddleware` is already abstracted — drop-in replacement for `resolveSession`
- Schema FK audit is the highest-risk item (board_api_keys, cli_auth_challenges)
- OAuth domain restriction requires post-sign-in email check (not native in Neon Auth)
- 4-plan split recommended
