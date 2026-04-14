# Codebase Structure

**Analysis Date:** 2026-04-13
**Source codebase:** `/Users/danielvm/Sites/paperclip` (pnpm monorepo)

## Directory Layout

```
paperclip/
├── server/                     # Express HTTP/WS backend
│   └── src/
│       ├── index.ts            # Process entry point
│       ├── app.ts              # Express app factory
│       ├── config.ts           # Config loading and resolution
│       ├── errors.ts           # HttpError factories
│       ├── telemetry.ts        # Optional telemetry client
│       ├── routes/             # Thin Express routers (one file per domain)
│       ├── services/           # Domain business logic (one file per concept)
│       ├── adapters/           # AI agent adapter dispatch and registry
│       │   ├── registry.ts     # Central adapter registry
│       │   ├── types.ts        # ServerAdapterModule interface
│       │   ├── http/           # Generic HTTP-based adapter runner
│       │   └── process/        # Generic child-process adapter runner
│       ├── middleware/         # Express middleware (auth, validation, error, logger)
│       ├── storage/            # Pluggable file storage (local disk or S3)
│       ├── secrets/            # Pluggable secret provider
│       ├── realtime/           # WebSocket live-events server
│       ├── auth/               # BetterAuth session resolver
│       └── __tests__/          # Vitest integration and unit tests for server
│
├── ui/                         # React SPA
│   ├── public/                 # Static assets (brand logos, favicons)
│   ├── vite.config.ts          # Vite dev server and build config
│   └── src/
│       ├── main.tsx            # React root, provider tree
│       ├── App.tsx             # React Router route declarations
│       ├── pages/              # One component file per route/page
│       ├── components/         # Shared UI components (~114 files)
│       ├── context/            # React Context providers
│       ├── hooks/              # Custom React hooks
│       ├── api/                # Typed fetch wrappers for all server endpoints
│       ├── adapters/           # UI-side adapter metadata and config-form renderers
│       ├── lib/                # Pure helper utilities (no React)
│       ├── fixtures/           # Test fixture data
│       └── plugins/            # Plugin bridge, launcher, slot system
│
├── cli/                        # CLI binary (paperclipai)
│   └── src/
│       ├── index.ts            # Commander entry point
│       ├── commands/           # One file per subcommand
│       ├── checks/             # Environment preflight checks
│       ├── config/             # CLI config read/write
│       ├── client/             # HTTP client to running server
│       ├── adapters/           # CLI-side adapter helpers
│       ├── prompts/            # Interactive @clack/prompts wrappers
│       ├── utils/              # Shared CLI utilities
│       └── __tests__/          # CLI unit tests
│
├── packages/
│   ├── shared/                 # Cross-package types, Zod validators, constants
│   │   └── src/
│   │       ├── types/          # Domain type files (one per concept)
│   │       ├── validators/     # Zod schema validators
│   │       └── telemetry/      # Telemetry event helpers
│   │
│   ├── db/                     # Drizzle ORM schema, migrations, Postgres lifecycle
│   │   └── src/
│   │       ├── schema/         # One Drizzle table definition file per table
│   │       ├── migrations/     # Generated SQL migration files
│   │       ├── client.ts       # Drizzle client factory
│   │       ├── migrate.ts      # Migration runner
│   │       ├── seed.ts         # Seed data
│   │       └── backup.ts       # Backup utilities
│   │
│   ├── adapter-utils/          # Adapter-facing interfaces (no Drizzle dependency)
│   │   └── src/
│   │       ├── types.ts        # AdapterAgent, AdapterRuntime, AdapterExecutionResult
│   │       ├── billing.ts      # Billing helpers
│   │       ├── session-compaction.ts
│   │       └── server-utils.ts
│   │
│   ├── adapters/               # One package per supported AI agent
│   │   ├── claude-local/
│   │   │   ├── index.ts        # Label, models, agentConfigurationDoc
│   │   │   └── src/server/     # execute.ts, test.ts, models.ts, skills.ts
│   │   ├── codex-local/
│   │   ├── cursor-local/
│   │   ├── gemini-local/
│   │   ├── openclaw-gateway/
│   │   ├── opencode-local/
│   │   └── pi-local/
│   │
│   ├── plugins/
│   │   ├── sdk/                # Plugin host protocol and SDK
│   │   │   └── src/
│   │   │       ├── protocol.ts          # JSON-RPC 2.0 message types
│   │   │       ├── host-client-factory.ts
│   │   │       ├── define-plugin.ts     # Plugin author API
│   │   │       ├── worker-rpc-host.ts
│   │   │       └── types.ts
│   │   ├── create-paperclip-plugin/     # Plugin scaffolding CLI
│   │   └── examples/                   # Sample plugins (hello-world, file-browser, etc.)
│   │
│   └── mcp-server/             # Model Context Protocol server
│       └── src/
│           ├── tools.ts        # MCP tool definitions
│           ├── stdio.ts        # Stdio transport
│           ├── client.ts       # HTTP client to Paperclip server
│           └── config.ts
│
├── tests/
│   ├── e2e/                    # Playwright end-to-end tests
│   └── release-smoke/          # Playwright smoke tests for release validation
│
├── evals/
│   └── promptfoo/              # LLM evaluation suite (promptfoo)
│
├── scripts/                    # Release, Docker, dev-runner, and utility shell/TS scripts
├── docker/                     # Docker Compose variants and quadlet config
├── docs/                       # Public-facing documentation (markdown)
├── doc/                        # Internal design specs, plans, experimental docs
├── data/                       # Runtime data directory (secrets, local DB)
├── patches/                    # pnpm patch overrides for dependencies
├── releases/                   # Release notes and changelog artifacts
│
├── package.json                # Root package: engines, scripts, devDependencies
├── pnpm-workspace.yaml         # Workspace member declarations
├── tsconfig.base.json          # Shared TypeScript compiler options
├── tsconfig.json               # Root TypeScript project references
├── vitest.config.ts            # Workspace-wide Vitest configuration
└── Dockerfile                  # Production Docker image definition
```

## Directory Purposes

**`server/src/routes/`:**
- Purpose: Thin Express route handlers; one file per resource domain
- Contains: Route registration, request parsing, calls to services, response shaping
- Key files: `server/src/routes/issues.ts`, `server/src/routes/agents.ts`, `server/src/routes/heartbeats.ts`, `server/src/routes/plugins.ts`, `server/src/routes/routines.ts`, `server/src/routes/projects.ts`, `server/src/routes/goals.ts`, `server/src/routes/authz.ts`
- Pattern: Each file creates a Router, mounts validate() middleware, and delegates to a service

**`server/src/services/`:**
- Purpose: All domain business logic; no HTTP concerns
- Contains: Service objects exported as named constants, each accepting `db: Db`
- Key files: `server/src/services/heartbeat.ts`, `server/src/services/issues.ts`, `server/src/services/agents.ts`, `server/src/services/workspace-runtime.ts`, `server/src/services/plugin-worker-manager.ts`, `server/src/services/plugin-job-scheduler.ts`, `server/src/services/live-events.ts`, `server/src/services/projects.ts`

**`server/src/adapters/`:**
- Purpose: AI agent adapter orchestration
- Contains: `registry.ts` (maps adapter type string to `ServerAdapterModule`), `types.ts` (interface definition), `http/` and `process/` generic runners used by multiple adapters
- Key files: `server/src/adapters/registry.ts`, `server/src/adapters/types.ts`, `server/src/adapters/http/execute.ts`, `server/src/adapters/process/execute.ts`

**`server/src/middleware/`:**
- Purpose: Express middleware stack
- Key files: `server/src/middleware/auth.ts` (actorMiddleware — resolves `req.actor`), `server/src/middleware/validate.ts` (Zod schema guard), `server/src/middleware/error-handler.ts` (central error serializer), `server/src/middleware/logger.ts` (pino HTTP logger), `server/src/middleware/board-mutation-guard.ts`

**`server/src/storage/`:**
- Purpose: Pluggable file storage behind a `StorageService` interface
- Key files: `server/src/storage/types.ts` (interface), `server/src/storage/local-disk-provider.ts`, `server/src/storage/s3-provider.ts`, `server/src/storage/provider-registry.ts`

**`server/src/secrets/`:**
- Purpose: Pluggable secret provider (local AES-256 encrypted or external stubs)
- Key files: `server/src/secrets/types.ts`, `server/src/secrets/local-encrypted-provider.ts`, `server/src/secrets/provider-registry.ts`, `server/src/secrets/external-stub-providers.ts`

**`server/src/__tests__/`:**
- Purpose: Co-located Vitest tests for server routes and services
- Contains: Integration tests using supertest + real DB; unit tests for services and adapters
- Key files: Most files named `*-routes.test.ts`, `*-service.test.ts`, or `*-routes.test.ts`

**`packages/db/src/schema/`:**
- Purpose: One Drizzle table definition file per database table
- Contains: `companies.ts`, `agents.ts`, `issues.ts`, `projects.ts`, `goals.ts`, `routines.ts`, `heartbeat_runs.ts`, `heartbeat_run_events.ts`, `plugins.ts`, `plugin_jobs.ts`, `plugin_config.ts`, `cost_events.ts`, `finance_events.ts`, `budgets.ts`, `budget_policies.ts`, `execution_workspaces.ts`, `documents.ts`, `approvals.ts`, and ~20 others

**`packages/shared/src/types/`:**
- Purpose: TypeScript domain types consumed across server, UI, and CLI; shared without importing DB or framework code
- Contains: One file per concept — `agent.ts`, `issue.ts`, `project.ts`, `goal.ts`, `heartbeat.ts`, `plugin.ts`, `live.ts`, `workspace-runtime.ts`, etc.

**`packages/adapters/{name}/src/server/`:**
- Purpose: Adapter runtime implementation for one AI agent type
- Contains: `execute.ts` (runs the agent for one heartbeat), `test.ts` (validates environment), `models.ts` (model list), and optionally `skills.ts` (skill sync), `quota.ts`
- Pattern: All exports compose into `ServerAdapterModule` registered in `server/src/adapters/registry.ts`

**`ui/src/pages/`:**
- Purpose: One React component file per application route
- Key files: `ui/src/pages/IssueDetail.tsx`, `ui/src/pages/ProjectDetail.tsx`, `ui/src/pages/Agents.tsx`, `ui/src/pages/Goals.tsx`, `ui/src/pages/Routines.tsx`, `ui/src/pages/PluginManager.tsx`, `ui/src/pages/Dashboard.tsx`, `ui/src/pages/Org.tsx`

**`ui/src/api/`:**
- Purpose: Typed fetch wrappers for every server endpoint; consumed by TanStack Query hooks
- Key files: `ui/src/api/client.ts` (base fetch + ApiError), `ui/src/api/issues.ts`, `ui/src/api/agents.ts`, `ui/src/api/heartbeats.ts`, `ui/src/api/projects.ts`, `ui/src/api/goals.ts`, `ui/src/api/plugins.ts`, `ui/src/api/routines.ts`

**`ui/src/context/`:**
- Purpose: React Context providers for app-wide state
- Key files: `ui/src/context/CompanyContext.tsx`, `ui/src/context/LiveUpdatesProvider.tsx`, `ui/src/context/ThemeContext.tsx`, `ui/src/context/SidebarContext.tsx`, `ui/src/context/DialogContext.tsx`, `ui/src/context/ToastContext.tsx`, `ui/src/context/PanelContext.tsx`

**`ui/src/adapters/`:**
- Purpose: UI-side adapter registry — display metadata and per-adapter config form renderers
- Key files: `ui/src/adapters/index.ts`, `ui/src/adapters/adapter-display-registry.ts`, `ui/src/adapters/dynamic-loader.ts`, per-adapter subdirectories (e.g., `claude-local/`, `gemini-local/`)

**`ui/src/plugins/`:**
- Purpose: Client-side plugin integration (postMessage bridge, plugin launcher, UI slots)
- Key files: `ui/src/plugins/bridge.ts`, `ui/src/plugins/bridge-init.ts`, `ui/src/plugins/launchers.tsx`, `ui/src/plugins/slots.tsx`

**`cli/src/commands/`:**
- Purpose: One file per CLI subcommand
- Key files: `cli/src/commands/run.ts`, `cli/src/commands/worktree.ts`, `cli/src/commands/configure.ts`, `cli/src/commands/env.ts`, `cli/src/commands/onboard.ts`, `cli/src/commands/routines.ts`, `cli/src/commands/doctor.ts`

**`tests/e2e/`:**
- Purpose: Playwright end-to-end test suite; runs against a live server
- Key files: `tests/e2e/onboarding.spec.ts`, `tests/e2e/signoff-policy.spec.ts`, `tests/e2e/playwright.config.ts`

**`scripts/`:**
- Purpose: Development tooling, Docker build, release automation, and code-generation scripts
- Key files: `scripts/dev-runner.mjs` (dev orchestrator), `scripts/docker-entrypoint.sh`, `scripts/release.sh`, `scripts/generate-company-assets.ts`, `scripts/ensure-plugin-build-deps.mjs`

## Key File Locations

**Entry Points:**
- `server/src/index.ts` — Server process entry: Postgres startup, migrations, HTTP/WS server
- `server/src/app.ts` — `createApp(db, opts)` — Express app factory, all middleware and routes
- `ui/src/main.tsx` — React root mount, all Context providers, React Router
- `ui/src/App.tsx` — Route table; maps URL paths to page components
- `cli/src/index.ts` — Commander root; registers all subcommands

**Configuration:**
- `server/src/config.ts` — Central config object; reads env vars, calls `config-file.ts`
- `server/src/config-file.ts` — JSON config file parser
- `tsconfig.base.json` — Shared TS compiler options (ES2023, NodeNext, strict)
- `vitest.config.ts` — Workspace Vitest config
- `ui/vite.config.ts` — Vite dev server (port 5173, proxies `/api` to 3100); path alias `@` → `ui/src`

**Core Logic:**
- `server/src/errors.ts` — `HttpError` class and factory functions (`badRequest`, `notFound`, etc.)
- `server/src/routes/authz.ts` — `assertCompanyAccess`, multi-tenancy gate
- `packages/db/src/client.ts` — Drizzle client factory
- `packages/db/src/schema/index.ts` — Barrel re-export of all table definitions
- `packages/shared/src/types/index.ts` — Barrel re-export of all domain types
- `packages/adapter-utils/src/types.ts` — `ServerAdapterModule` interface
- `server/src/adapters/registry.ts` — Adapter type-to-module map

**Testing:**
- `server/src/__tests__/` — Server integration and unit tests (Vitest + supertest)
- `ui/src/` — UI component and hook tests are co-located beside source files (`*.test.tsx`, `*.test.ts`)
- `packages/*/src/` — Package unit tests co-located (`*.test.ts`)
- `tests/e2e/` — Playwright E2E tests
- `tests/release-smoke/` — Playwright release smoke tests

## Naming Conventions

**Files:**
- Server routes, services, middleware: `kebab-case.ts` (e.g., `heartbeat-run-summary.ts`)
- UI pages: `PascalCase.tsx` (e.g., `IssueDetail.tsx`, `ProjectDetail.tsx`)
- UI components: `PascalCase.tsx` (e.g., `CommandPalette.tsx`, `CommentThread.tsx`)
- UI api wrappers: `camelCase.ts` (e.g., `heartbeats.ts`, `inboxDismissals.ts`)
- UI hooks: `useCamelCase.ts` (e.g., `useKeyboardShortcuts.ts`, `useInboxBadge.ts`)
- UI context providers: `PascalCaseContext.tsx` or `PascalCaseProvider.tsx`
- DB schema tables: `snake_case.ts` matching table name (e.g., `heartbeat_runs.ts`, `plugin_jobs.ts`)
- Test files: `{source-file-basename}.test.ts` or `{source-file-basename}.test.tsx`

**Directories:**
- Package directories: `kebab-case` (e.g., `adapter-utils`, `claude-local`, `mcp-server`)
- Source directories within packages: lowercase singular noun (`routes/`, `services/`, `types/`, `schema/`)

**Exports:**
- Services export a single named object constant: `export const issueService = { ... }`
- Route files call `router.{method}(path, ...)` and `export default router`
- Adapter packages export metadata from `index.ts` and runtime from `src/server/` sub-path
- `packages/shared` and `packages/db` use barrel `index.ts` files for public API surface

## Where to Add New Code

**New API endpoint (server):**
1. Add route handler to the matching file in `server/src/routes/` (or create `server/src/routes/{domain}.ts`)
2. Mount the new router in `server/src/app.ts`
3. Add business logic to `server/src/services/{domain}.ts`
4. Add Zod input schema to `packages/shared/src/validators/` or inline in the route file
5. Add integration tests to `server/src/__tests__/{domain}-routes.test.ts`

**New database table:**
1. Create `packages/db/src/schema/{table_name}.ts` with Drizzle table definition
2. Re-export from `packages/db/src/schema/index.ts`
3. Generate migration: `pnpm --filter @paperclipai/db drizzle-kit generate`

**New domain type:**
1. Create `packages/shared/src/types/{concept}.ts`
2. Re-export from `packages/shared/src/types/index.ts`

**New UI page:**
1. Create `ui/src/pages/{PageName}.tsx` (PascalCase)
2. Register route in `ui/src/App.tsx`
3. Add API wrappers to `ui/src/api/{domain}.ts`

**New UI component:**
1. Create `ui/src/components/{ComponentName}.tsx`
2. No barrel file required; import directly from file path

**New AI agent adapter:**
1. Create `packages/adapters/{agent-name}/` workspace package
2. Implement `index.ts` (label, models, agentConfigurationDoc) and `src/server/{execute,test}.ts`
3. Register the `ServerAdapterModule` in `server/src/adapters/registry.ts`
4. Add UI-side display entry in `ui/src/adapters/adapter-display-registry.ts`

**New CLI subcommand:**
1. Create `cli/src/commands/{command-name}.ts`
2. Register command in `cli/src/index.ts`

**New plugin:**
1. Use `packages/plugins/create-paperclip-plugin/` scaffolder
2. Implement using `packages/plugins/sdk/src/define-plugin.ts` API
3. Reference examples in `packages/plugins/examples/`

**Shared utilities:**
- Pure helpers with no framework imports: `ui/src/lib/{utility}.ts`
- Server-only utilities: `server/src/services/{utility}.ts` or inline in service file
- Cross-package domain helpers: `packages/shared/src/{utility}.ts`

## Special Directories

**`data/`:**
- Purpose: Runtime data for local deployments — local encrypted secrets, embedded Postgres data
- Generated: Yes (at runtime)
- Committed: No (in `.gitignore`)

**`packages/shared/dist/`:**
- Purpose: Compiled output of `@paperclipai/shared` (pre-built for consumption)
- Generated: Yes (`tsc`)
- Committed: No

**`patches/`:**
- Purpose: pnpm patch files overriding specific dependency behavior (e.g., `embedded-postgres`)
- Generated: No
- Committed: Yes

**`releases/`:**
- Purpose: Release metadata, changelogs, and version artifacts
- Generated: Partially (by `scripts/release.sh`)
- Committed: Yes

**`_bmad/` and `_bmad-output/`:**
- Purpose: BMAD planning artifacts (PRDs, architecture docs, implementation plans) — not production code
- Generated: No
- Committed: Yes (planning record)

**`evals/promptfoo/`:**
- Purpose: LLM evaluation suite; tests agent prompt quality with promptfoo runner
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-04-13*
