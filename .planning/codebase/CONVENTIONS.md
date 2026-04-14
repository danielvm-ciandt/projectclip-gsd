# CONVENTIONS.md — Code Style and Patterns

## Language & Module System

- **TypeScript strict mode** throughout — `strict: true` in all tsconfig files
- **ESM-only**: `"type": "module"` in package.json; imports require `.js` extension even for `.ts` source files
- **NodeNext module resolution** — explicit file extensions mandatory in all import paths
- **Target**: ESNext (server), ES2020+ (UI)

## File Naming

| Context | Convention | Example |
|---------|-----------|---------|
| Source files | `kebab-case` | `heartbeat-service.ts`, `issue-tracker.ts` |
| React components | `PascalCase` | `AgentDetail.tsx`, `TaskCard.tsx` |
| Test files | Co-located, `<subject>.test.ts(x)` | `heartbeat.test.ts` next to `heartbeat.ts` |
| Route files | `kebab-case` | `agent-routes.ts` |
| Validator files | `kebab-case` | `agent-validators.ts` |

## Service Factory Pattern

Services are plain factory functions (not classes) that close over injected dependencies:

```ts
// server/src/services/example.ts
export function exampleService(db: Db) {
  async function getById(id: string) { ... }
  async function create(data: CreateInput) { ... }
  return { getById, create };
}
export type ExampleService = ReturnType<typeof exampleService>;
```

- One factory per service file
- Factory receives `db: Db` (and other deps) as arguments
- Returns a plain object of methods
- Type alias via `ReturnType<typeof serviceFactory>`

## Error Handling

Errors are thrown as `HttpError` instances using semantic factory functions:

```ts
// server/src/errors.ts
import { badRequest, notFound, unauthorized, forbidden } from './errors.js';

throw notFound('Agent not found');
throw badRequest('Invalid input');
throw unauthorized();
throw forbidden('Insufficient permissions');
```

- Never return error codes from service functions
- Use `HttpError` subclasses for HTTP-aware error responses
- Express error middleware handles `HttpError` → structured JSON response

## Validation

Request validation uses Zod schemas wired through a `validate()` middleware:

```ts
// packages/shared/src/validators/agent.ts
export const createAgentSchema = z.object({ ... });

// server route
router.post('/', validate(createAgentSchema), handler);
```

- Schemas live in `packages/shared/src/validators/`
- `validate(schema)` middleware applies to request body; throws `badRequest` on failure
- Shared schemas are reused in UI for client-side validation

## Import Ordering

1. Node.js built-ins (`node:fs`, `node:path`)
2. Third-party packages (`express`, `zod`, `vitest`)
3. Workspace packages (`@paperclip/shared`)
4. Relative imports (`./errors.js`, `../services/agent.js`)

`.js` extension required on all relative and workspace imports.

## Logging

Pino logger is used throughout the server:

```ts
import { log } from './log.js';
log.info({ agentId }, 'Agent started');
log.error({ err }, 'Unexpected failure');
```

- Structured logging with context objects as first argument
- Sensitive fields redacted via `server/src/log-redaction.ts`
- Log levels: `trace`, `debug`, `info`, `warn`, `error`
- Never use `console.log` in production server code

## React & UI Patterns

- Functional components only — no class components
- Custom hooks prefixed with `use` in `ui/src/hooks/`
- Page components in `ui/src/pages/` — one file per route
- Shared components in `ui/src/components/`
- State management: React context + hooks (no Redux/Zustand detected)

## Database Access

- `Db` type wraps a postgres.js connection
- DB access only in service layer — never in route handlers directly
- Migrations in `server/src/migrations/` using sequential numbering

## TypeScript Patterns

- Prefer `interface` for object shapes that may be extended; `type` for unions/intersections
- Avoid `any` — use `unknown` and narrow explicitly
- Prefer named exports over default exports
- No barrel files (`index.ts` re-exports) in service directories
