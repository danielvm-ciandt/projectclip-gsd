# Phase 1: Fork & platform baseline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `01-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-13
**Phase:** 1 — Fork & platform baseline
**Areas discussed:** Fork import & baseline, CI & e2e, Toolchain, Release engineering

---

## Fork import & baseline

| Option | Description | Selected |
|--------|-------------|----------|
| Local clone as-is, fix tests, manual next steps | Start from Paperclip clone; green tests; user drives follow-on | ✓ |
| Greenfield layout | Redesign repo layout in Phase 1 | |
| Automated import only | No manual iteration | |

**User's choice:** Start from Paperclip as-is with fixed tests (local clone); go forward by themselves.

**Notes:** No architectural redesign in Phase 1; baseline completeness = import + quality gates per requirements.

---

## CI & e2e — workflow layout (2a)

| Option | Description | Selected |
|--------|-------------|----------|
| Match Paperclip | Same workflow structure as upstream | ✓ |
| Single new layout | Invent new CI structure for Project Clip | |
| Split vs single | User deferred to upstream parity | ✓ (via Paperclip) |

**User's choice:** Same as Paperclip.

---

## CI & e2e — when/how e2e runs (2b)

| Option | Description | Selected |
|--------|-------------|----------|
| Paperclip original strategy | Triggers and scope as upstream | ✓ |
| Every PR full e2e | | |
| Main only | | |

**User's choice:** Same as Paperclip original strategy.

---

## Toolchain (3)

| Option | Description | Selected |
|--------|-------------|----------|
| Match upstream Paperclip | Node 20+, pnpm 9 / `packageManager` from fork | ✓ |
| Bump pnpm (e.g. 10) in Phase 1 | | |

**User's choice:** 3:1 — match upstream.

---

## semantic-release validation (4a)

| Option | Description | Selected |
|--------|-------------|----------|
| Dry-run on main merges | Not every PR by default | ✓ |
| Dry-run on every PR | | |

**User's choice:** 4a:1 — dry-run on main (merge path).

---

## First release expectation (4b)

| Option | Description | Selected |
|--------|-------------|----------|
| First green `main` → `v0.0.1` patch semantics | Per Epic 0 / PRD | ✓ |
| Other versioning | | |

**User's choice:** 4b:1.

---

## Claude's Discretion

- Optional PR-scoped dry-run when only release config changes — minor; document in plan if used.

## Deferred Ideas

None recorded.
