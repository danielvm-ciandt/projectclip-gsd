# TESTING.md — Test Structure and Practices

## Test Runner

**Vitest 3.x** — workspace config at `vitest.config.ts` (repo root) orchestrating 6 project sub-configs.

```
vitest.config.ts                    ← root workspace config
server/vitest.config.ts             ← server unit + integration
ui/vitest.config.ts                 ← UI component tests
packages/*/vitest.config.ts         ← package-level configs
tests/e2e/playwright.config.ts      ← E2E (Playwright)
tests/release-smoke/playwright.config.ts  ← release smoke (Playwright)
```

Run all tests: `npm test` or `vitest run`
Run server tests only: `vitest run --project server`

## Test Volume

| Area | Count | Location |
|------|-------|----------|
| Server tests | ~120 | `server/src/__tests__/` |
| UI tests | ~50 | Co-located with source in `ui/src/` |
| E2E tests | N/A | `tests/e2e/` |
| Release smoke | N/A | `tests/release-smoke/` |

## Three Test Tiers

### 1. Pure Unit Tests
No database, no HTTP. Test pure logic:
```ts
import { describe, it, expect } from 'vitest';
describe('myUtil', () => {
  it('does X', () => {
    expect(myUtil(input)).toBe(expected);
  });
});
```

### 2. Supertest HTTP Integration Tests
Uses Express app with mock auth injected — no real DB:
```ts
import supertest from 'supertest';
import { createApp } from '../app.js';

const app = createApp({ auth: mockAuth, db: mockDb });
const res = await supertest(app).post('/api/agents').send(body);
expect(res.status).toBe(201);
```

### 3. Embedded Postgres Integration Tests
Real database, skipped on unsupported hosts. Pattern:
```ts
describeEmbeddedPostgres('AgentService', (getDb) => {
  it('creates an agent', async () => {
    const db = getDb();
    const service = agentService(db);
    const result = await service.create({ ... });
    expect(result.id).toBeDefined();
  });
});
```
`describeEmbeddedPostgres` is a custom helper that:
- Spins up embedded Postgres before the suite
- Tears it down after
- Calls `describe.skip` when the host doesn't support embedded PG

## Mocking

```ts
// Module-level mocking with vi.hoisted
const mockThing = vi.hoisted(() => vi.fn());
vi.mock('./thing.js', () => ({ thing: mockThing }));

// Function stubs
const stub = vi.fn().mockResolvedValue(result);

// Spy
vi.spyOn(service, 'method').mockReturnValue(value);
```

- `vi.hoisted()` ensures mock factory runs before module evaluation
- `vi.mock()` for module replacement
- `vi.fn()` for stubs and spies

## UI / DOM Tests

```ts
// @vitest-environment jsdom
import { createRoot } from 'react-dom/client';
import { act } from 'react';

it('renders correctly', async () => {
  const div = document.createElement('div');
  await act(() => { createRoot(div).render(<MyComponent />); });
  expect(div.textContent).toContain('Expected text');
});
```

- `// @vitest-environment jsdom` directive at top of file switches environment
- Default environment is `node` for all tests
- No React Testing Library (RTL) — uses `createRoot` + `act` directly
- No `@testing-library/jest-dom` matchers

## E2E Tests

**Playwright** at `tests/e2e/`:
- Full browser automation against a running Paperclip instance
- Release smoke tests at `tests/release-smoke/` for post-deploy validation

Run: `npx playwright test`

## Coverage

- No coverage thresholds enforced in any vitest config
- No `--coverage` flag in default test script
- Coverage is ad-hoc / opt-in

## Known Testing Gaps

- `goals.ts`, `finance.ts`, `dashboard.ts`, `live-events.ts`, `access.ts` services have **no unit tests**
- UI file coverage is approximately **21%**
- `describeEmbeddedPostgres` tests skip silently on most CI hosts unless embedded PG is configured

## Test File Conventions

- Server tests: `server/src/__tests__/<feature>.test.ts`
- UI tests: co-located as `ui/src/components/Foo/Foo.test.tsx`
- Shared package tests: co-located with source
- Test helpers: `server/src/__tests__/helpers/`
- No `__mocks__` directories — mocking done inline with `vi.mock()`
