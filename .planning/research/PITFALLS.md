# Pitfalls Research

**Domain:** Forked agent orchestration platform + Neon + CPS/SDD layer  
**Researched:** 2026-04-13  
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Fork drift from Paperclip upstream

**What goes wrong:** Merge pain each quarter; subtle behavior differences in core execution, budgets, or isolation.

**Why it happens:** “Quick fixes” in core instead of extension packages; duplicated logic in fork.

**How to avoid:** Prefer new packages (`portfolio-core`, `cps-framework`, `method-adapters/*`); document `FORK_DIFF.md`; contribute adapter APIs upstream when possible.

**Warning signs:** Copy-paste edits in `server/src` core files; failing to rebase for months.

**Phase to address:** Ongoing — Epic 0 establishes baseline; Epic 3 rebrand is a natural sync checkpoint.

---

### Pitfall 2: Neon Auth / session regression for agents and API tokens

**What goes wrong:** Login works, but agent execution, plugins, or token auth breaks silently.

**Why it happens:** Middleware assumptions from self-hosted Better Auth differ from Neon Auth session resolution.

**How to avoid:** Integration test matrix: user session, service token, agent operation after auth migration; staged rollout on a branch.

**Warning signs:** 401s only in background jobs or WS connections; intermittent session loss on preview deploys.

**Phase to address:** Epic 1 (Neon Auth) — before declaring Epic 1 done.

---

### Pitfall 3: Neon connection pooling / cold start latency

**What goes wrong:** Flaky tests, slow first request, connection exhaustion under load.

**Why it happens:** Serverless driver misuse vs long-lived Express; too many direct connections.

**How to avoid:** Use pooler URL where appropriate; benchmark Express + Drizzle; document recommended `DATABASE_URL` shape for dev/CI/prod.

**Warning signs:** `too many connections`; high p99 on cold routes.

**Phase to address:** Epic 2 (Neon Database) + performance hardening before pilot (Epic 7–8).

---

### Pitfall 4: Schema changes break Paperclip tests

**What goes wrong:** New `NOT NULL` or renamed columns break upstream assumptions.

**Why it happens:** Tight coupling of tests to seed data shapes.

**How to avoid:** Additive columns nullable initially; feature-flag CPS columns; expand test fixtures.

**Warning signs:** Mass test failure after migration; need rollbacks.

**Phase to address:** Epic 4+ whenever touching `projects` and shared tables.

---

### Pitfall 5: Method Adapter API leakage

**What goes wrong:** Core imports adapter internals; every new method requires core edits.

**Why it happens:** Rushing first adapter without stable interface.

**How to avoid:** Freeze API after Epic 6; semantic-version adapter packages; integration tests per adapter.

**Warning signs:** `import` from `bmad` inside core routing; circular deps.

**Phase to address:** Epic 6 — with explicit API freeze milestone.

---

### Pitfall 6: Multi-tenant data leakage (portfolio / client boundary)

**What goes wrong:** Cross-tenant reads in new Client/Team queries.

**Why it happens:** New joins without `company_id` predicate; copy-paste queries.

**How to avoid:** Reuse established tenant patterns from Paperclip; add query helpers; audit tests for `company_id` on all new entities.

**Warning signs:** Bug reports “wrong client data”; flaky RLS if introduced later.

**Phase to address:** Epic 4+ — critical before any pilot data (Epic 8).

---

### Pitfall 7: Ticketing bridge data exfiltration (Epic 11)

**What goes wrong:** Internal notes, budgets, or PII synced to client tools.

**Why it happens:** Broad default field maps; missing redaction/approval.

**How to avoid:** Per-project allow-list; redaction pipeline; first-write approval (PRD §13.3.2); sandboxed adapters.

**Warning signs:** Customer escalations; audit findings.

**Phase to address:** Epic 11 — not v1, but design hooks early (events, approval IDs).

---

## Pitfall Summary Table

| Pitfall | Severity | Primary mitigation |
|---------|----------|-------------------|
| Fork drift | High | Extension packages + FORK_DIFF + periodic sync |
| Auth regression | High | Test matrix + middleware parity |
| DB pooling / latency | Medium | Pooler + benchmarks |
| Schema breakage | Medium | Additive, nullable, flags |
| Adapter API creep | Medium | Freeze + package boundaries |
| Tenant leakage | Critical | Tenant predicates + tests |
| Bridge exfiltration | Critical | Allow-list + redaction + approvals |

## Sources

- `projectclip-prd.md` §15–16 — risks and open questions
- `.planning/PROJECT.md` — constraints

---
*Pitfalls research for: Project Clip*  
*Researched: 2026-04-13*
