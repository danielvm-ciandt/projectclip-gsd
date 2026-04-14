import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { actorMiddleware } from "../middleware/auth.js";
import { createLocalAgentJwt } from "../agent-auth-jwt.js";

// Minimal mock db — agent JWT path needs agentApiKeys query (null) and agents query (valid record)
function makeMockDb(opts: { agentExists: boolean } = { agentExists: true }) {
  const agentRecord = opts.agentExists
    ? { id: "agent-1", companyId: "company-1", status: "active" }
    : null;

  // Drizzle fluent query builder mock: select().from().where().then(fn)
  const makeSelectChain = (result: unknown) => ({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    then: vi.fn((fn: (rows: unknown[]) => unknown) => Promise.resolve(fn(result ? [result] : []))),
  });

  const db = {
    select: vi.fn(() => makeSelectChain(null)),   // agentApiKeys → no match
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })) })),
  } as any;

  // The middleware's query chain for agentApiKeys returns empty (no key found)
  // Then for agents table — override select to return the agent record on second call
  let selectCallCount = 0;
  db.select = vi.fn(() => {
    selectCallCount++;
    if (selectCallCount === 1) {
      // First select: board API keys lookup (via boardAuthService) → null
      return makeSelectChain(null);
    }
    if (selectCallCount === 2) {
      // Second select: agentApiKeys lookup → no match
      return makeSelectChain(null);
    }
    // Third select: agents lookup (when JWT is valid and key-less)
    return makeSelectChain(agentRecord);
  });

  return db;
}

function createApp(mockDb: any, opts: { mockResolveSession?: ReturnType<typeof vi.fn> } = {}) {
  const app = express();
  app.use(express.json());
  app.use(
    actorMiddleware(mockDb, {
      deploymentMode: "authenticated",
      resolveSession: opts.mockResolveSession,
    }),
  );
  app.get("/test", (req, res) => {
    res.status(200).json({ actor: (req as any).actor });
  });
  return app;
}

describe("agent-auth-passthrough (AUTH-04)", () => {
  const secretEnv = "PAPERCLIP_AGENT_JWT_SECRET";
  const originalSecret = process.env[secretEnv];

  beforeEach(() => {
    process.env[secretEnv] = "test-agent-secret";
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalSecret === undefined) delete process.env[secretEnv];
    else process.env[secretEnv] = originalSecret;
    vi.restoreAllMocks();
  });

  it("Test 1: valid Bearer JWT resolves actor.type=agent without calling resolveNeonAuthSession", async () => {
    const mockResolveSession = vi.fn().mockResolvedValue(null);
    const db = makeMockDb({ agentExists: true });
    const app = createApp(db, { mockResolveSession });

    const token = createLocalAgentJwt("agent-1", "company-1", "claude_local", "run-1");
    expect(token).not.toBeNull();

    const res = await request(app)
      .get("/test")
      .set("Authorization", `Bearer ${token!}`);

    expect(res.status).toBe(200);
    expect(res.body.actor.type).toBe("agent");
    expect(res.body.actor.source).toBe("agent_jwt");
    // resolveNeonAuthSession must NOT have been called for Bearer requests
    expect(mockResolveSession).not.toHaveBeenCalled();
  });

  it("Test 2: invalid Bearer JWT does not fall through to session resolution (actor type stays none)", async () => {
    const mockResolveSession = vi.fn().mockResolvedValue({
      session: { id: "sess-1", userId: "user-1" },
      user: { id: "user-1", email: "test@example.com", name: "Test" },
    });
    const db = makeMockDb({ agentExists: false });
    const app = createApp(db, { mockResolveSession });

    const res = await request(app)
      .get("/test")
      .set("Authorization", "Bearer invalid.jwt.token");

    expect(res.status).toBe(200);
    // actor should not be "board" (from session) because Bearer path skips session resolution
    expect(res.body.actor.type).not.toBe("board");
    // resolveSession must NOT have been called — Bearer token present means session path is skipped
    expect(mockResolveSession).not.toHaveBeenCalled();
  });

  it("Test 3: no Authorization header calls resolveSession (the session path)", async () => {
    const mockResolveSession = vi.fn().mockResolvedValue({
      session: { id: "sess-1", userId: "user-1" },
      user: { id: "user-1", email: "test@example.com", name: "Test User" },
    });
    const db = makeMockDb();
    const app = createApp(db, { mockResolveSession });

    // Mock the DB for companyMemberships and instanceUserRoles queries (session resolution path)
    let selectCallCount = 0;
    db.select = vi.fn(() => {
      selectCallCount++;
      // Return empty arrays for role/membership queries to avoid errors
      return {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        then: vi.fn((fn: (rows: unknown[]) => unknown) => Promise.resolve(fn([]))),
      };
    });

    const res = await request(app).get("/test");

    expect(res.status).toBe(200);
    // resolveSession was called because no Bearer token was present
    expect(mockResolveSession).toHaveBeenCalledOnce();
  });
});
