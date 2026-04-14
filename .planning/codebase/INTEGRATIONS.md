# External Integrations

**Analysis Date:** 2026-04-13

## AI Agent Adapters

Each adapter is a workspace package that wraps a local AI CLI tool or a remote gateway. All adapters implement the same `ServerAdapterModule` interface registered in `server/src/adapters/registry.ts`.

**Claude (Anthropic):**
- Package: `@paperclipai/adapter-claude-local` (`packages/adapters/claude-local/`)
- Wraps: `@anthropic-ai/claude-code` CLI (installed globally in Docker)
- Auth: API key configured per-agent via agent environment bindings

**Codex (OpenAI):**
- Package: `@paperclipai/adapter-codex-local` (`packages/adapters/codex-local/`)
- Wraps: `@openai/codex` CLI (installed globally in Docker)
- Auth: API key configured per-agent via agent environment bindings

**Cursor:**
- Package: `@paperclipai/adapter-cursor-local` (`packages/adapters/cursor-local/`)
- Wraps: local Cursor agent process

**Gemini (Google):**
- Package: `@paperclipai/adapter-gemini-local` (`packages/adapters/gemini-local/`)
- Wraps: local Gemini CLI agent process

**OpenCode:**
- Package: `@paperclipai/adapter-opencode-local` (`packages/adapters/opencode-local/`)
- Wraps: `opencode-ai` CLI (installed globally in Docker)

**Pi:**
- Package: `@paperclipai/adapter-pi-local` (`packages/adapters/pi-local/`)
- Wraps: local Pi agent process

**OpenClaw Gateway:**
- Package: `@paperclipai/adapter-openclaw-gateway` (`packages/adapters/openclaw-gateway/`)
- Transport: WebSocket (`ws://` or `wss://`) to a remote OpenClaw gateway server
- Auth modes: `authToken` / `token`, `headers.x-openclaw-token`, `headers.x-openclaw-auth`, or `password`
- Device auth: Ed25519 keypair signing with optional auto-pair flow
- Config: `ws` dependency; gateway URL + credentials configured per-adapter instance

**Hermes:**
- Package: `hermes-paperclip-adapter` 0.2.0 (external npm package, closed-source)
- Registered in `server/src/adapters/registry.ts` alongside internal adapters
- Auth: per-agent environment bindings

**Plugin-based Adapters:**
- The server also supports dynamically loaded external adapters via the plugin system (`server/src/adapters/plugin-loader.ts`, `server/src/services/plugin-registry.ts`)
- Plugins run in a sandboxed worker (`server/src/services/plugin-runtime-sandbox.ts`)

## Data Storage

**Databases:**
- PostgreSQL (primary)
  - Mode 1: Embedded — `embedded-postgres` 18.1.0-beta.16 (patched), auto-managed at runtime; data dir from `PAPERCLIP_HOME` or config file
  - Mode 2: External — connection via `DATABASE_URL` env var or config file `database.connectionString`
  - Client: Drizzle ORM (`packages/db/src/`), `postgres` driver 3.4.5
  - Migrations: SQL files in `packages/db/src/migrations/`, applied by `packages/db/src/migrate.ts`
  - Drizzle config: `packages/db/drizzle.config.ts`
  - Auth tables: `authUsers`, `authSessions`, `authAccounts`, `authVerifications` (owned by better-auth, via Drizzle adapter)

**Backups:**
- Automated periodic PostgreSQL backups built into the server
- Configurable: `PAPERCLIP_DB_BACKUP_ENABLED`, `PAPERCLIP_DB_BACKUP_INTERVAL_MINUTES` (default 60), `PAPERCLIP_DB_BACKUP_RETENTION_DAYS` (default 7), `PAPERCLIP_DB_BACKUP_DIR`
- Backup script: `scripts/backup-db.sh`

**File Storage:**
- Provider 1: Local disk — files stored under `PAPERCLIP_STORAGE_LOCAL_DIR` or `~/.paperclip/storage`; implemented in `server/src/storage/local-disk-provider.ts`
- Provider 2: S3-compatible — `@aws-sdk/client-s3` 3.888.0; implemented in `server/src/storage/s3-provider.ts`
  - Connection: `PAPERCLIP_STORAGE_S3_BUCKET`, `PAPERCLIP_STORAGE_S3_REGION`, `PAPERCLIP_STORAGE_S3_ENDPOINT` (optional, for self-hosted S3), `PAPERCLIP_STORAGE_S3_PREFIX`, `PAPERCLIP_STORAGE_S3_FORCE_PATH_STYLE`
  - Standard AWS credential chain applies (no explicit env var — relies on `@aws-sdk/client-s3` defaults)
- Provider selection: `PAPERCLIP_STORAGE_PROVIDER` env var or config file `storage.provider`
- Storage abstraction: `server/src/storage/types.ts` and `server/src/storage/service.ts`

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- better-auth 1.4.18 — self-hosted, email/password only
- Implementation: `server/src/auth/better-auth.ts`
- Database backend: Drizzle adapter (`better-auth/adapters/drizzle`) against PostgreSQL
- Secret: `BETTER_AUTH_SECRET` (or fallback `PAPERCLIP_AGENT_JWT_SECRET`)
- Sign-up: enabled by default; can be disabled via `PAPERCLIP_AUTH_DISABLE_SIGN_UP=true`
- Cookies: secure by default; set `useSecureCookies: false` when running over plain HTTP
- Trusted origins: derived from `PAPERCLIP_AUTH_PUBLIC_BASE_URL` and `PAPERCLIP_ALLOWED_HOSTNAMES`

**Agent JWT Auth:**
- Agents authenticate to the server via short-lived JWTs
- Implementation: `server/src/agent-auth-jwt.ts`
- Signing secret: `PAPERCLIP_AGENT_JWT_SECRET` (fallback for `BETTER_AUTH_SECRET`)

## Secrets Management

**Providers (selected via `PAPERCLIP_SECRETS_PROVIDER`):**
- `local_encrypted` (default) — AES-256-GCM encryption at rest; master key file at `PAPERCLIP_SECRETS_MASTER_KEY_FILE`; implementation: `server/src/secrets/local-encrypted-provider.ts`
- `aws_secrets_manager` — stub, not implemented in this build (`server/src/secrets/external-stub-providers.ts`)
- `gcp_secret_manager` — stub, not implemented in this build
- `vault` (HashiCorp) — stub, not implemented in this build
- Strict mode: `PAPERCLIP_SECRETS_STRICT_MODE=true` enforces all secret refs must resolve

**Secret storage:** secrets and their versions are persisted in PostgreSQL tables (`companySecrets`, `companySecretVersions` — `server/src/services/secrets.ts`)

## Monitoring & Observability

**Telemetry:**
- Internal telemetry client in `@paperclipai/shared/telemetry`
- Enabled by default; disable via config file `telemetry.enabled: false`
- Periodic flush (60s interval) — `server/src/telemetry.ts`

**Feedback / Trace Export:**
- Optional export of agent feedback traces to `https://telemetry.paperclip.ing` (default) or a custom `PAPERCLIP_FEEDBACK_EXPORT_BACKEND_URL`
- Auth token: `PAPERCLIP_FEEDBACK_EXPORT_BACKEND_TOKEN`
- Implementation: `server/src/services/feedback-share-client.ts`
- Payload: gzip-compressed JSON over HTTPS POST

**Error Tracking:**
- None detected (no Sentry, Datadog, Rollbar, etc.)

**Logging:**
- pino structured JSON logging via `server/src/middleware/logger.ts` and `pino-http`
- Log redaction: `server/src/log-redaction.ts`, `server/src/redaction.ts`

## GitHub Integration

**GitHub / GitHub Enterprise fetch:**
- `server/src/services/github-fetch.ts` — utility for fetching from `github.com` or GitHub Enterprise (`hostname/api/v3`) raw file URLs
- Used for reading CLAUDE.md / agent skill files from repositories
- No OAuth; uses token passed in request headers from agent configuration

## MCP (Model Context Protocol)

**MCP Server:**
- Package: `@paperclipai/mcp-server` (`packages/mcp-server/`)
- SDK: `@modelcontextprotocol/sdk` 1.29.0
- Binary: `paperclip-mcp-server` (stdio transport)
- Exposes Paperclip board operations to MCP-compatible clients

## Plugin System

**Plugin Host:**
- Plugins run as sandboxed Node.js workers (`server/src/services/plugin-runtime-sandbox.ts`)
- Worker communication via `@paperclipai/plugin-sdk` protocol (`packages/plugins/sdk/`)
- Plugin dev server: `paperclip-plugin-dev-server` binary from `@paperclipai/plugin-sdk`
- File watching for dev reload: `server/src/services/plugin-dev-watcher.ts` via chokidar

## CI/CD & Deployment

**Hosting:**
- Docker — `Dockerfile`, `docker-compose.yml`, `docker-compose.quickstart.yml`, `docker-compose.untrusted-review.yml`
- Quadlet support for systemd-managed containers: `docker/quadlet/`

**CI Pipeline:**
- None detected in repository (no `.github/workflows/`, `.circleci/`, `.gitlab-ci.yml`)
- Release scripts: `scripts/release.sh`, `scripts/create-github-release.sh`, `scripts/rollback-latest.sh`
- npm publishing: `scripts/build-npm.sh` (builds and packs all publishable packages)

**Deployment Modes:**
- `local_trusted` — single-user local mode, no authentication enforced
- `authenticated` — multi-user mode with better-auth session enforcement

## Real-time Communication

**WebSocket (server → client):**
- Live event streaming for board updates: `server/src/realtime/live-events-ws.ts`
- Uses native `ws` library; clients connect to `/ws` endpoint
- Managed by `server/src/services/live-events.ts`

## Environment Configuration

**Required env vars:**
- `BETTER_AUTH_SECRET` — auth signing secret (minimum requirement for all modes)

**Required for external PostgreSQL mode:**
- `DATABASE_URL` — PostgreSQL connection string

**Required for S3 storage:**
- `PAPERCLIP_STORAGE_PROVIDER=s3`
- `PAPERCLIP_STORAGE_S3_BUCKET`, `PAPERCLIP_STORAGE_S3_REGION`

**Optional env vars:**
- `PORT` (default 3100)
- `HOST` (default 127.0.0.1)
- `SERVE_UI` (default true in Docker)
- `PAPERCLIP_DEPLOYMENT_MODE`, `PAPERCLIP_DEPLOYMENT_EXPOSURE`
- `PAPERCLIP_AUTH_PUBLIC_BASE_URL`, `PAPERCLIP_AUTH_DISABLE_SIGN_UP`
- `PAPERCLIP_SECRETS_PROVIDER`, `PAPERCLIP_SECRETS_MASTER_KEY_FILE`, `PAPERCLIP_SECRETS_STRICT_MODE`
- `PAPERCLIP_STORAGE_S3_ENDPOINT`, `PAPERCLIP_STORAGE_S3_PREFIX`, `PAPERCLIP_STORAGE_S3_FORCE_PATH_STYLE`
- `PAPERCLIP_FEEDBACK_EXPORT_BACKEND_URL`, `PAPERCLIP_FEEDBACK_EXPORT_BACKEND_TOKEN`
- `PAPERCLIP_DB_BACKUP_ENABLED`, `PAPERCLIP_DB_BACKUP_INTERVAL_MINUTES`, `PAPERCLIP_DB_BACKUP_RETENTION_DAYS`, `PAPERCLIP_DB_BACKUP_DIR`
- `HEARTBEAT_SCHEDULER_ENABLED`, `HEARTBEAT_SCHEDULER_INTERVAL_MS`
- `PAPERCLIP_TAILNET_BIND_HOST` — Tailscale network binding

**Secrets location:**
- `.env` loaded from `PAPERCLIP_HOME/env` path and/or CWD `.env`
- `.env.example` present at repo root with minimal dev defaults

---

*Integration audit: 2026-04-13*
