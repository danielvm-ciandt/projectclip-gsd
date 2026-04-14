# Technology Stack

**Analysis Date:** 2026-04-13

## Languages

**Primary:**
- TypeScript 5.7.3 - All packages (server, ui, cli, adapters, db, shared, mcp-server, plugin-sdk)

**Secondary:**
- Shell scripts - Release automation, Docker entrypoints (`scripts/`, `Dockerfile`)

## Runtime

**Environment:**
- Node.js >=20 (enforced in root `package.json` `engines` field)

**Package Manager:**
- pnpm 9.15.4 (pinned via `packageManager` field)
- Lockfile: `pnpm-lock.yaml` present and committed

## Workspace Layout

This is a pnpm monorepo with the following workspace members (`pnpm-workspace.yaml`):
- `packages/*` — shared libraries (db, shared, adapter-utils, mcp-server)
- `packages/adapters/*` — AI agent adapter plugins (claude-local, codex-local, cursor-local, gemini-local, openclaw-gateway, opencode-local, pi-local)
- `packages/plugins/*` — plugin SDK and examples
- `server` — Express HTTP/WS backend (`@paperclipai/server`)
- `ui` — React SPA (`@paperclipai/ui`)
- `cli` — CLI binary (`paperclipai`)

## Frameworks

**Backend:**
- Express 5.1.0 - HTTP API server (`server/src/app.ts`)
- ws 8.19.0 - WebSocket server for live events and OpenClaw gateway transport (`server/src/realtime/live-events-ws.ts`, `packages/adapters/openclaw-gateway/`)

**Frontend:**
- React 19.0.0 - UI component library (`ui/src/`)
- Vite 6.1.0 - Dev server and build tool (`ui/vite.config.ts`)
- React Router DOM 7.1.5 - Client-side routing
- TanStack React Query 5.90.21 - Server state management
- Tailwind CSS 4.0.7 - Utility-first CSS framework
- Radix UI - Headless component primitives (`radix-ui`, `@radix-ui/react-slot`)
- `@assistant-ui/react` 0.12.23 - AI chat UI components
- `@mdxeditor/editor` 3.52.4 - Rich text / MDX editor
- `@dnd-kit/core`, `@dnd-kit/sortable` - Drag and drop
- Lexical 0.35.0 - Rich text editor engine
- Mermaid 11.12.0 - Diagram rendering
- `cmdk` 1.1.1 - Command palette component
- `lucide-react` - Icon library

**CLI:**
- `commander` 13.1.0 - Argument parsing (`cli/src/`)
- `@clack/prompts` 0.10.0 - Interactive terminal prompts

**ORM / DB:**
- Drizzle ORM 0.38.4 - Type-safe query builder (`packages/db/src/`)
- drizzle-kit 0.31.9 - Migration generation (`packages/db/drizzle.config.ts`)

**Validation:**
- Zod 3.24.2 - Runtime schema validation (server, mcp-server, plugin-sdk)
- AJV 8.18.0 + ajv-formats 3.0.1 - JSON Schema validation (server)

**Logging:**
- pino 9.6.0 + pino-http 10.4.0 + pino-pretty 13.1.3 - Structured logging (server)

**Auth:**
- better-auth 1.4.18 - Email/password sessions with Drizzle adapter (`server/src/auth/better-auth.ts`)

**Testing:**
- Vitest 3.0.5 - Unit/integration test runner (workspace-wide, `vitest.config.ts`)
- Playwright 1.58.2 - End-to-end and release smoke tests (`tests/e2e/`, `tests/release-smoke/`)
- supertest 7.0.0 - HTTP integration test client (server devDependency)
- promptfoo 0.103.3 - LLM eval framework (`evals/promptfoo/`)

**Build:**
- tsc - Primary TypeScript compilation for all packages
- esbuild 0.27.3 - CLI bundle (`cli/esbuild.config.mjs`)
- tsx 4.19.2 - TypeScript execution for development scripts

**Image Processing:**
- sharp 0.34.5 - Image resizing/conversion (server)

**File Watching:**
- chokidar 4.0.3 - File system watcher (server, plugin dev watcher)

**MCP:**
- `@modelcontextprotocol/sdk` 1.29.0 - Model Context Protocol server (`packages/mcp-server/`)

## Key Dependencies

**Critical:**
- `embedded-postgres` 18.1.0-beta.16 (patched) - Bundled PostgreSQL for local/single-node deployment; configured in `server/src/config.ts` as `databaseMode: "embedded-postgres" | "postgres"`
- `drizzle-orm` 0.38.4 - All database access goes through this ORM
- `better-auth` 1.4.18 - All authentication; secret read from `BETTER_AUTH_SECRET` env var
- `@aws-sdk/client-s3` 3.888.0 - S3 storage backend (`server/src/storage/s3-provider.ts`)
- `hermes-paperclip-adapter` 0.2.0 - External closed-source adapter for "Hermes" agent type

**Infrastructure:**
- `dotenv` 17.0.1 - `.env` file loading at startup (`server/src/config.ts`)
- `multer` 2.1.1 - Multipart file upload handling (server)
- `dompurify` 3.3.2 + `jsdom` 28.1.0 - HTML sanitization (server-side)
- `open` 11.0.0 - Opens browser on startup (server)
- `detect-port` 2.1.0 - Port availability detection (server)
- `picocolors` 1.1.1 - Terminal color output (CLI, adapters)

## Configuration

**Environment Variables (required):**
- `DATABASE_URL` - PostgreSQL connection string (only when `databaseMode=postgres`)
- `BETTER_AUTH_SECRET` or `PAPERCLIP_AGENT_JWT_SECRET` - Auth signing secret (required always)
- `PORT` - HTTP port (default: 3100)
- `SERVE_UI` - Whether server serves the SPA (default: true in Docker)

**Environment Variables (optional / storage):**
- `PAPERCLIP_STORAGE_PROVIDER` - `local_disk` (default) or `s3`
- `PAPERCLIP_STORAGE_S3_BUCKET`, `PAPERCLIP_STORAGE_S3_REGION`, `PAPERCLIP_STORAGE_S3_ENDPOINT`, `PAPERCLIP_STORAGE_S3_PREFIX`, `PAPERCLIP_STORAGE_S3_FORCE_PATH_STYLE`

**Environment Variables (optional / deployment):**
- `PAPERCLIP_DEPLOYMENT_MODE` - `local_trusted` (default) or `authenticated`
- `PAPERCLIP_DEPLOYMENT_EXPOSURE` - `private` (default) or `public`
- `PAPERCLIP_AUTH_PUBLIC_BASE_URL` / `BETTER_AUTH_URL` / `BETTER_AUTH_BASE_URL` - Auth base URL
- `PAPERCLIP_AUTH_DISABLE_SIGN_UP` - Disable new registrations
- `PAPERCLIP_BIND` - Network bind mode
- `PAPERCLIP_SECRETS_PROVIDER` - `local_encrypted` (default), `aws_secrets_manager`, `gcp_secret_manager`, or `vault`
- `PAPERCLIP_SECRETS_MASTER_KEY_FILE` - Path to AES-256 master key file

**Config File:**
- JSON config file at path from `PAPERCLIP_CONFIG` env var or platform default
- Configures database, auth, storage, secrets, telemetry, server bind/exposure
- Loaded in `server/src/config-file.ts`, consumed in `server/src/config.ts`

**Example env file:** `.env.example` present at root

**Build:**
- `tsconfig.base.json` - Shared TS compiler options (target ES2023, NodeNext modules, strict)
- Per-package `tsconfig.json` extending base

## Platform Requirements

**Development:**
- Node.js >=20
- pnpm 9.15.4
- PostgreSQL (or embedded-postgres handles it automatically in local mode)

**Production:**
- Docker image based on `node:lts-trixie-slim`
- Docker Compose files: `docker-compose.yml`, `docker-compose.quickstart.yml`, `docker-compose.untrusted-review.yml`
- Port 3100 exposed; `/paperclip` volume for persistent state
- Installs `@anthropic-ai/claude-code`, `@openai/codex`, and `opencode-ai` globally at image build time for local AI agent execution

---

*Stack analysis: 2026-04-13*
