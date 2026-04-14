# Feature Research

**Domain:** Internal consulting portfolio orchestration (CPS-compliant, method-aware SDD)  
**Researched:** 2026-04-13  
**Confidence:** HIGH (grounded in PROJECT.md + PRD)

## Feature Landscape

### Table Stakes (Users Expect These)

Features internal users assume exist. Missing these = product feels incomplete for a delivery cockpit.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Secure login + session | Any multi-tenant app | LOW–MED | Neon Auth migration must preserve agent/API token flows |
| Portfolio / tenant isolation | Paperclip already has `companies` | MED | Reuse; extend with portfolio profile metadata |
| Projects, issues, goals, budgets | Core Paperclip | LOW (inherited) | Regression-test after Neon + rebrand |
| Routines + triggers + runs | CPS “executable rituals” | MED | Seed from templates; cron/event/manual |
| Approvals / audit trail | Gates + compliance | MED | Wire CPS gates to existing approvals |
| Role-aware assignments | CPS RACI | MED | `role_catalog` + FK from agents/teams — no free text |
| Method-agnostic progress UI | PRD core promise | HIGH | Method Adapter API + ProjectDetail extension |
| Read-only finance/budget views | PMO persona | LOW | Reuse cost/finance events |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Portfolio → Client → Project → Team hierarchy | Portfolio-shaped work, not single-company | HIGH | New tables; navigation + filters |
| CPS lifecycle + gates (Setup / Production Flow / Value Activation) | “CPS by default” | HIGH | Phases, gates, templates from CPSBok |
| Per-project Story Style + SDD method | Native progress per method | HIGH | Adapters: BMAD, Spec-Kit, Taskmaster, CAPS in v1 |
| CPS routine pack + deliverable templates | Replace PDF checklists | HIGH | `routine_templates`, `deliverable_templates`, rendering |
| Portfolio health dashboard | GU lead 30-second signal | MED–HIGH | Weighted scoring — formula TBD (open question in PRD) |
| Ticketing bridge (later) | Client SoT in Jira/ADO/etc. | VERY HIGH | Epic 11; redaction + approvals |

### Anti-Features (Commonly Requested, Risky)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Client login / portal | “Transparency” | Out of scope v1; support burden | Sync to client ticketing tool (Epic 11) |
| Custom frameworks day one | Flexibility | Explodes maintenance | CPS + 9 methods first; plugin API v1.2 |
| Full billing / forecasting | Revenue visibility | Duplicates Portfolio Cockpit | Read-only exports + link to cockpit |
| One-size-fits-all Kanban for all methods | Simple UI | Violates method-aware promise | Adapter-driven phase strip + gates |
| Invented role titles | Quick staffing | Breaks HR/pricing alignment | role-directory PR first |

## Feature Dependencies

```
Neon Auth + Neon DB (foundation)
    └── Epic 0 quality gates stable
            └── Rebrand / package identity
                    └── Portfolio hierarchy (clients, teams, project extensions)
                            └── CPS framework (phases, gates, templates, routines)
                                    └── Method adapters + ProjectDetail UI
                                            └── Dashboard + routine execution + deliverable rendering
                                                    └── Pilot → GA
Ticketing bridge (Epic 11) ──depends on──> stable internal CPS loop + governance
```

## MVP vs Later (from PRD alignment)

**MVP (v1.0) emphasis:** Internal CPS loop, four method adapters, portfolio hierarchy, health dashboard, pilot — **not** ticketing bridge.

**v1.1+:** Remaining SDD adapters (GSD, OpenSpec, etc.) as separate minors.

## Sources

- `.planning/PROJECT.md` — scope and out-of-scope
- `projectclip-prd.md` (repo root) — epics, personas, success metrics

---
*Feature research for: Project Clip*  
*Researched: 2026-04-13*
