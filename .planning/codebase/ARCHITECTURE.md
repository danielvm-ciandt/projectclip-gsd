# Architecture

**Analysis Date:** 2026-04-13

## Pattern Overview

**Overall:** Monorepo — layered, service-oriented backend with an adapter plugin system for AI agents

**Key Characteristics:**
- pnpm workspaces monorepo: `server`, `ui`, `cli`, and `packages/*`
- Express HTTP server with domain-service layer sitting above a Drizzle ORM + PostgreSQL data layer
- AI agent execution is abstracted behind a `ServerAdapterModule` interface; each adapter (claude_local, codex_local, cursor_local, gemini_local, openclaw_gateway, http, process, etc.) is registered in a central registry
- Plugins run in isolated child processes, communicating with the host via JSON-RPC 2.0 over stdio
- Real-time UI updates delivered via a company-scoped WebSocket (SSE-style live events)
- Two deployment modes: `local_trusted` (single-user local) and `authenticated` (multi-user with BetterAuth)

## Layers

**Data Layer:**
- Purpose: Schema definitions, migrations, embedded/external Postgres management
- Location: `packages/db/src/`
- Contains: Drizzle schema files per table (`packages/db/src/schema/`), migration runner, embedded-postgres lifecycle helpers, backup utilities
- Depends on: `postgres` driver, Drizzle ORM
- Used by: `server`, `cli`

**Shared Types / Domain Contracts:**
- Purpose: Cross-package type definitions, Zod validators, and constants used by both server and UI
- Location: `packages/shared/src/`
- Contains: `types/` (domain type files per concept), validators, adapter type enums, telemetry helpers
- Depends on: nothing internal
- Used by: `server`, `ui`, `cli`, `packages/adapters/*`

**Adapter-Utils:**
- Purpose: Pure adapter-facing interfaces (no Drizzle dependency) for the `ServerAdapterModule` contract
- Location: `packages/adapter-utils/src/`
- Contains: `types.ts` (AdapterAgent, AdapterExecutionResult, AdapterRuntime, etc.), billing helpers, session-compaction utilities
- Depends on: nothing internal
- Used by: `packages/adapters/*`, `server/src/adapters/`

**Adapter Packages:**
- Purpose: One package per supported AI agent; each exports a shared metadata surface and a `server` sub-path with the runtime `execute` / `testEnvironment` / `sessionCodec` functions
- Location: `packages/adapters/{claude-local,codex-local,cursor-local,gemini-local,openclaw-gateway,opencode-local,pi-local}/`
- Contains: `index.ts` (label, models, agentConfigurationDoc), `src/server/` (execute, test, optional skill-sync)
- Depends on: `@paperclipai/adapter-utils`, `@paperclipai/shared`
- Used by: `server/src/adapters/registry.ts`

**Plugin SDK:**
- Purpose: Host-side plugin protocol implementation; used by the server to build host-client handlers and by plugin authors to build plugins
- Location: `packages/plugins/sdk/src/`
- Contains: `protocol.ts` (JSON-RPC message types and codes), `host-client-factory.ts`, `define-plugin.ts`, `worker-rpc-host.ts`
- Depends on: nothing internal
- Used by: `server/src/app.ts`, plugin packages

**Server:**
- Purpose: HTTP API, business logic services, plugin lifecycle management, adapter dispatch, real-time events
- Location: `server/src/`
- Contains:
  - `index.ts` — process entry point: starts embedded/external Postgres, applies migrations, starts HTTP + WS server
  - `app.ts` — Express app factory: mounts middleware and all route handlers
  - `routes/` — thin Express routers, one file per domain (issues, agents, projects, plugins, etc.)
  - `services/` — domain logic (issueService, heartbeatService, workspaceRuntime, etc.); each file exports a service object
  - `adapters/` — adapter registry, process- and HTTP-based generic adapter runners, per-adapter shimming
  - `middleware/` — actorMiddleware (auth resolution), validation, error handler, HTTP logger
  - `storage/` — pluggable file storage (local disk or S3) behind a `StorageService` interface
  - `secrets/` — pluggable secret provider (local encrypted or external stub) behind a typed interface
  - `realtime/` — WebSocket server for live events (`live-events-ws.ts`)
  - `auth/` — BetterAuth session resolver (`better-auth.ts`)
- Depends on: `@paperclipai/db`, `@paperclipai/shared`, `@paperclipai/adapter-utils`, all adapter packages, `@paperclipai/plugin-sdk`
- Used by: nothing (leaf in the dependency graph)

**CLI:**
- Purpose: Developer and operator CLI; wraps the server's internal APIs and provides `run`, `worktree`, `auth`, `configure`, etc. commands
- Location: `cli/src/`
- Contains: `index.ts` (Commander setup), `commands/` (one file per subcommand), `checks/`, `config/`, `adapters/`, `prompts/`
- Depends on: `@paperclipai/shared`, HTTP client to the running server
- Used by: nothing (leaf)

**UI:**
- Purpose: React SPA served statically by the server in production or via Vite dev server
- Location: `ui/src/`
- Contains: `main.tsx` (React root, provider tree), `App.tsx` (React Router routes), `pages/` (one file per page), `components/`, `context/`, `hooks/`, `api/` (typed fetch wrappers), `adapters/` (UI-side adapter metadata and config-form renderers), `lib/` (pure helpers), `plugins/` (plugin bridge/launcher)
- Depends on: `@paperclipai/shared`; communicates with `server` via HTTP `/api/*` and WebSocket
- Used by: nothing (leaf)

**MCP Server:**
- Purpose: Model Context Protocol server; exposes Paperclip tools to external MCP clients
- Location: `packages/mcp-server/src/`
- Contains: `tools.ts`, `stdio.ts`, `client.ts`, `config.ts`, `format.ts`
- Depends on: `@paperclipai/shared`

## Data Flow

**Agent Heartbeat / Task Execution:**

1. Client (UI or CLI) calls `POST /api/heartbeats/:agentId/run` → `server/src/routes/` route handler
2. Route calls `heartbeatService.run(...)` in `server/src/services/heartbeat.ts`
3. `heartbeatService` resolves the agent's adapter type, calls `getServerAdapter(adapterType)` from `server/src/adapters/registry.ts`
4. Registry returns the matching `ServerAdapterModule`; `heartbeatService` calls `adapter.execute(context)` with the resolved execution workspace, secrets, and skill snapshot
5. Adapter spawns or invokes the AI agent process (child process for local adapters, HTTP/WebSocket for remote adapters)
6. Execution result is written to `heartbeat_runs` and `heartbeat_run_events` via Drizzle; cost events are emitted to `cost_events`
7. `publishLiveEvent` fires a company-scoped in-memory event that the WebSocket handler (`realtime/live-events-ws.ts`) broadcasts to connected browser clients

**UI Real-Time Updates:**

1. `ui/src/context/LiveUpdatesProvider.tsx` opens a WebSocket connection to `ws://.../api/live-events`
2. Server authenticates the connection via cookie/token, subscribes to company events
3. On `LiveEvent` receipt, the provider calls `queryClient.invalidateQueries(...)` to refresh TanStack Query caches
4. React components re-render from fresh query data

**Plugin Job Execution:**

1. Plugin installed → `pluginLoader` registers it; `pluginWorkerManager` forks a child process
2. Host calls into plugin via JSON-RPC 2.0 over child stdin/stdout (`plugin-worker-manager.ts`)
3. Plugin responds with tool results; `pluginJobScheduler` tracks scheduled jobs in `plugin_jobs` table
4. Plugin events are fanned out via `pluginEventBus` (in-memory EventEmitter)

**State Management (UI):**

- Server state: TanStack Query with 30-second stale time, window-focus refetch
- App-wide UI state: React Context providers (CompanyContext, ThemeContext, SidebarContext, DialogContext, ToastContext, PanelContext, BreadcrumbContext)
- No client-side global store (no Redux/Zustand)

## Key Abstractions

**ServerAdapterModule:**
- Purpose: The contract every AI-agent adapter must implement
- Examples: `packages/adapters/claude-local/src/server/`, `server/src/adapters/http/index.ts`
- Pattern: Plain object implementing `{ type, execute, testEnvironment, models, agentConfigurationDoc, sessionCodec?, listSkills?, syncSkills? }`; registered in `server/src/adapters/registry.ts`

**HttpError / domain error factories:**
- Purpose: Typed HTTP errors thrown from services and route handlers, caught by the central error handler
- Examples: `server/src/errors.ts` — `badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `unprocessable`
- Pattern: Throw an `HttpError`; the `errorHandler` middleware serializes it to JSON

**StorageService interface:**
- Purpose: Pluggable file storage abstraction (local disk or S3)
- Examples: `server/src/storage/types.ts`, `server/src/storage/local-disk-provider.ts`, `server/src/storage/s3-provider.ts`
- Pattern: Interface-first; `createStorageServiceFromConfig` selects the concrete implementation at startup

**Domain Services:**
- Purpose: Business logic isolated from HTTP layer; one exported object per file
- Examples: `server/src/services/issueService`, `server/src/services/heartbeatService`, `server/src/services/agentService`
- Pattern: Each service file exports a single named object (e.g., `export const issueService = { ... }`) and takes `db: Db` as a closure dependency

**actorMiddleware:**
- Purpose: Resolves the authenticated principal on every request, attaching it to `req.actor`
- Location: `server/src/middleware/auth.ts`
- Pattern: Supports three actor sources — local implicit board (trusted mode), JWT bearer (agent), and BetterAuth session cookie (authenticated mode)

## Entry Points

**Server process:**
- Location: `server/src/index.ts`
- Triggers: `node server/src/index.ts` or via pnpm `dev`/`dev:server`
- Responsibilities: Load config, start embedded/external Postgres, apply migrations, instantiate DB client + storage + secret providers, call `createApp(db, opts)`, start HTTP + WebSocket server, print startup banner

**Express app factory:**
- Location: `server/src/app.ts` — `createApp(db, opts)`
- Triggers: Called by `index.ts`
- Responsibilities: Compose Express middleware stack, mount all route routers, wire plugin subsystem

**UI entry:**
- Location: `ui/src/main.tsx`
- Triggers: Browser loads `/index.html` (served by server in production or Vite in dev)
- Responsibilities: Mount React root with all context providers and the `<App />` router

**CLI entry:**
- Location: `cli/src/index.ts`
- Triggers: `pnpm paperclipai <command>`
- Responsibilities: Parse subcommands via Commander; each command talks to the running server over HTTP

## Error Handling

**Strategy:** Exception-based with a centralized Express error handler

**Patterns:**
- Services throw `HttpError` instances (from `server/src/errors.ts`) for expected failures
- Route handlers pass errors to `next(err)` or throw (async handlers are wrapped)
- `server/src/middleware/error-handler.ts` — `errorHandler()` — catches `HttpError`, `ZodError`, and unknown errors; serializes each to a JSON response with the appropriate status code
- Zod schema validation is applied via `validate(schema)` middleware (`server/src/middleware/validate.ts`) before route handlers
- UI `ApiError` class (`ui/src/api/client.ts`) wraps non-OK fetch responses for typed error handling in React components

## Cross-Cutting Concerns

**Logging:** `pino` via `server/src/middleware/logger.ts`; `httpLogger` middleware logs every request/response; `logger` singleton used directly in services

**Validation:** Zod schemas defined in `packages/shared/src/` for domain types; applied on the server via `validate()` middleware and on the UI via inline schema parsing

**Authentication:** `actorMiddleware` resolves `req.actor` (three modes: `local_implicit`, `agent_jwt`, `better_auth_session`); downstream services use `assertCompanyAccess` from `server/src/routes/authz.ts` to gate multi-tenancy

**Telemetry:** Optional telemetry client, initialized at startup (`server/src/telemetry.ts`); tracking calls made from route handlers and services; shared telemetry helpers in `packages/shared/src/telemetry/`

---

*Architecture analysis: 2026-04-13*
