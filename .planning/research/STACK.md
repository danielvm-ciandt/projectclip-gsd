# Stack Research

**Domain:** Internal consulting portfolio orchestration platform (fork of Paperclip + CPS/SDD layer)  
**Researched:** 2026-04-13  
**Confidence:** HIGH (aligned with locked decisions in `.planning/PROJECT.md` and upstream Paperclip stack)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | 20+ (CI may use 24 LTS) | Runtime | Matches Paperclip; long-term support; native fetch; worker threads for sandboxes |
| TypeScript | ~5.7, `strict`, `NodeNext` | Type safety | Already enforced upstream; non-negotiable for fork drift control |
| pnpm | 9.x | Monorepo package manager | Workspace protocol; deterministic installs; matches Paperclip |
| Express | 5 | HTTP + WS gateway | Existing server; pino logging; minimal migration surface |
| PostgreSQL (Neon) | Serverless Postgres (current Neon platform) | Primary datastore | Branching per env/PR; no server ops; wire-compatible with existing Drizzle migrations |
| Drizzle ORM | ^0.38 | Schema + migrations | Already owns all migrations; additive schema for CPS/portfolio layer |
| `@neondatabase/serverless` or pooler | Current stable | DB driver | Serverless-friendly; required for Neon edge/serverless runtimes; verify pooler URL for long-lived server |
| Neon Auth | Managed auth (Better Auth–compatible; see Neon docs — **beta** as of research date) | Sessions, OAuth, branch-aware auth | Replaces self-hosted Better Auth; auth data in DB branches with preview isolation |
| React | 19 | SPA UI | Existing UI; Router 7, TanStack Query, Radix, Lexical |
| Vite | 6 | Frontend build | Fast HMR; existing pipeline |
| Tailwind CSS | v4 | Styling | Existing design system path |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 3 | Unit/integration tests | All packages; workspace projects |
| Playwright | Current | E2E | Release gate; critical flows (auth, project CRUD) |
| Zod | (as in repo) | Runtime validation | API boundaries, env, adapter configs |
| semantic-release + angular preset | Per repo | Versioning | Already specified; Conventional Commits |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| GitHub Actions | CI | Match quality gate: install → typecheck → test → build → e2e |
| Neon Console / API | Branches, auth enablement | Enable Neon Auth per branch; pooler endpoints for CI |
| Docker | Deployable image | Multi-stage; align with upstream Dockerfile patterns |

## Installation

Follow upstream Paperclip workspace after fork. Add Neon-specific env vars (`DATABASE_URL` with SSL, Neon Auth URLs/secrets per [Neon Auth docs](https://neon.com/docs/auth/overview)) rather than inventing new package managers.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Neon + Drizzle | Supabase / PlanetScale | Not chosen — team committed to Neon branching + Auth integration with existing Drizzle |
| Neon Auth | Self-hosted Better Auth | Interim fallback if Neon Auth beta blocks a feature (PRD risk mitigation) |
| `@neondatabase/serverless` | `pg` with pooler only | Use `pg` + pooler if long-lived Node server shows driver constraints; benchmark first |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Embedded Postgres in production | Conflicts with Neon migration goals; ops burden | Neon branches for dev/CI |
| Rewriting ORM layer | High drift from Paperclip | Drizzle additive migrations only |
| Ad-hoc auth (custom JWT) | Breaks Better Auth parity and Neon Auth migration | Neon Auth or documented Better Auth fallback |

## Stack Patterns by Variant

**If preview/PR environment:**

- Use Neon **branch** + Neon Auth branch-aware config so sessions are isolated.
- CI: create or attach branch; run migrations against branch URL.

**If local dev:**

- Prefer Neon dev branch or local Postgres **only** if upstream still supports it short-term; align with Epic 3 goal to remove embedded Postgres.

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Drizzle ^0.38 | Postgres 14+ (Neon) | Run `drizzle-kit migrate` against Neon before cutting releases |
| Better Auth ecosystem | Neon Auth | Treat Neon Auth as managed Better Auth–compatible — verify adapter APIs at integration time |
| Express 5 | Node 20+ | Keep middleware ordering identical when swapping auth session resolution |

## Sources

- [Neon Auth overview](https://neon.com/docs/auth/overview) — branching, managed auth
- [Neon Database introduction](https://neon.com/docs/introduction) — serverless Postgres
- `.planning/PROJECT.md` — locked stack and constraints
- Upstream Paperclip (local clone) — source of truth for versions

---
*Stack research for: Project Clip (portfolio + CPS/SDD orchestration)*  
*Researched: 2026-04-13*
