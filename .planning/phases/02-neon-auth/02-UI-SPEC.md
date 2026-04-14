---
phase: 2
slug: neon-auth
status: draft
shadcn_initialized: true
preset: new-york
created: 2026-04-14
---

# Phase 2 — UI Design Contract

> Visual and interaction contract for **Neon Auth** (Epic 1). Aligns with `.planning/phases/02-neon-auth/02-CONTEXT.md`. Generated for `/gsd-ui-phase 2`.

---

## Scope & screens

| Screen / state | Purpose |
|----------------|--------|
| **Sign-in (primary)** | OAuth-first (`@ciandt.com`); same-origin route **`/login`** (see **Routing**). |
| **Legacy redirect** | **`/auth`** → **`/login`** (301 or client redirect) so existing bookmarks and links keep working. |
| **Session loading** | Full-viewport centered “Loading…” while session is resolved (match current `Auth.tsx` loading pattern). |
| **Auth error** | Inline error under the form with **problem + next step** (retry, contact admin, or use correct account). |
| **Access not allowed** | Dedicated message when OAuth succeeds but user is not permitted (e.g. wrong workspace / no public sign-up) — **no** generic “No data found.” |

**Out of scope for this UI-SPEC:** Phase 4 rebrand copy (“Project Clip” naming). Until then, **match current Paperclip chrome** on auth surfaces (**02-CONTEXT D-02**): Sparkles mark, wordmark text “Paperclip”, split layout (form column + optional right panel).

---

## Routing

- **Canonical entry:** **`/login`** on the SPA (same origin as app) — **02-CONTEXT D-03**.
- **Compatibility:** Support **`/auth`** as an alias that redirects to **`/login`**, preserving `?next=` query param.

---

## Neon-first integration (layout)

- **Neon-first:** Use Neon’s documented **components or embed patterns** where they exist; **wrap** them in the **existing auth shell** so the page still reads as Paperclip: **left column** = brand row + heading + actions; **right column** = `AsciiArtAnimation` (md+) unchanged unless Neon blocks iframe/layout (**02-CONTEXT D-01**).
- **Focal point:** The **primary OAuth control** (e.g. “Continue with Google”) is the **first interactive element** in the main column after the title/description — largest visual weight among actions.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | **shadcn/ui** (initialized — `ui/components.json`) |
| Preset | **new-york** |
| Component library | **Radix** (via shadcn) |
| Icon library | **lucide-react** |
| Font | **Inherit app default** (system / theme from `ui/src/index.css` — do not introduce a second font family for this phase) |

---

## Spacing Scale

Declared values (multiples of **4**). Use Tailwind spacing that maps to these (e.g. `p-4` = 16px).

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, tight inline gaps |
| sm | 8px | Between label and field |
| md | 16px | Default stack between form groups (`space-y-4`) |
| lg | 24px | Below heading block |
| xl | 32px | Horizontal padding of form column (`px-8` on large screens) |
| 2xl | 48px | Vertical padding blocks (`py-12`) |
| 3xl | 64px | Rare section breaks only |

**Exceptions:** None unless a Neon embed requires ±4px — then document in PR with screenshot.

---

## Typography

**Max four semantic sizes** (maps to existing `Auth.tsx` patterns):

| Role | Size | Weight | Line height |
|------|------|--------|-------------|
| **Label** | 12px (`text-xs`) | 400 | 1.4 |
| **Body** | 14px (`text-sm`) | 400 | 1.5 |
| **Title** | 20px (`text-xl`) | 600 (`font-semibold`) | 1.25 |
| **Brand / small UI** | 14px (`text-sm`) | 500 (`font-medium`) | 1.4 |

No additional display size on this phase’s screens unless OAuth provider iframe forces one — if so, treat iframe as third-party and do not add a fifth app token.

---

## Color

Semantic mapping to **`ui/src/index.css`** CSS variables (light scheme). Do **not** introduce purple/blue gradients as the primary brand treatment.

| Role | Value | Usage |
|------|-------|--------|
| **Dominant (60%)** | `--background` / `--foreground` | Full viewport background, main text |
| **Secondary (30%)** | `--muted`, `--muted-foreground`, `--border` | Descriptions, field borders, dividers |
| **Accent (10%)** | `--primary` / `--primary-foreground` | **Only:** primary OAuth CTA fill, primary text button emphasis |
| **Destructive** | `--destructive` | Inline auth errors, “access denied” when action is invalid |

**Accent reserved for:** Primary OAuth button, **one** text link style for secondary action (e.g. “Use email instead”) if present — **not** every `Button` or link.

**Focus:** Use `--ring` for focus rings on interactive elements (keyboard).

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| **Primary CTA (OAuth)** | **“Continue with Google”** (or exact Neon-recommended label if documented; must stay verb + provider). |
| **Secondary CTA (email break-glass)** | **“Sign in with email”** — not “Submit” or “Sign In” alone. |
| **Submit in-flight** | **“Signing in…”** (OAuth or email submit). |
| **Page title** | **“Sign in to Paperclip”** (until Phase 4 rebrand). |
| **Subtitle** | **“Use your CI&T Google account (@ciandt.com).”** |
| **Empty / signed-out** | N/A as empty list — use session loading copy instead. |
| **Session loading** | **“Loading…”** (keep short; may add “Checking your session…” if product approves). |
| **Error (generic)** | **“Sign-in failed. Try again, or contact your administrator if this keeps happening.”** |
| **Error (wrong domain / not allowed)** | **“This instance only allows CI&T Google accounts. Use an @ciandt.com address or contact your administrator.”** |
| **Destructive / irreversible** | N/A on sign-in — no destructive confirmation in this phase’s primary flow. |

**Sign-up:** **No** “Create account” or public sign-up messaging in default layout (**02-CONTEXT D-05**). Remove or hide toggle that switches to sign-up (current `Auth.tsx` has “Need an account?” — **do not show** in Neon Auth default mode).

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| **shadcn official** | `Button`, `Input` (if refactored from raw inputs), patterns from `ui/components/ui/*` | **not required** for official registry |
| **Neon / third-party auth embeds** | Only wrappers in `ui/src/pages/…` — **no** unvetted shadcn community registries | If a new block is added from a non-official registry → **shadcn view + diff** required before merge |

---

## Accessibility

- OAuth button: **visible text** + `aria-busy` when loading.
- Email path (if present): labels associated with `htmlFor`, errors linked via `aria-describedby` where possible.
- Color contrast: meet **WCAG AA** for text on `--background` using existing theme tokens.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS — CTAs are verb + target (“Continue with Google”, “Sign in with email”); errors include a next step; no generic “Submit” / “OK”.
- [x] Dimension 2 Visuals: PASS — Focal point: primary OAuth control; split layout and brand row preserved from current `Auth.tsx`.
- [x] Dimension 3 Color: PASS — Accent limited to primary OAuth CTA + one secondary link style; 60/30/10 mapped to semantic roles; destructive for errors.
- [x] Dimension 4 Typography: PASS — Four roles (12 / 14 / 20 / 14 brand), line heights set; no fifth app size.
- [x] Dimension 5 Spacing: PASS — Scale uses 4px grid; exceptions disallowed without PR.
- [x] Dimension 6 Registry Safety: PASS — Official shadcn only; non-official blocks require gate.

**Approval:** approved 2026-04-14 (orchestrator self-check per `gsd-ui-checker` criteria)

---

## UI-SPEC VERIFIED

All six dimensions **PASS**. No revision loop required.
