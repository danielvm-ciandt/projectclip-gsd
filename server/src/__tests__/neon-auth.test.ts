import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request } from "express";

// We will test the module after it is created.
// These tests define the expected contract for neon-auth.ts.

const originalEnv = {
  NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL,
};

describe("neon-auth", () => {
  beforeEach(() => {
    process.env.NEON_AUTH_BASE_URL = "https://neon.example.com/neondb/auth";
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
    if (originalEnv.NEON_AUTH_BASE_URL === undefined) {
      delete process.env.NEON_AUTH_BASE_URL;
    } else {
      process.env.NEON_AUTH_BASE_URL = originalEnv.NEON_AUTH_BASE_URL;
    }
  });

  describe("resolveNeonAuthSession", () => {
    it("Test 1: returns NeonAuthSessionResult when fetch returns 200 + user body", async () => {
      const { resolveNeonAuthSession } = await import("../auth/neon-auth.js");

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          session: { id: "sess-1", userId: "user-1", expiresAt: "2026-12-31T00:00:00Z" },
          user: { id: "user-1", email: "test@example.com", name: "Test User", image: null },
        }),
      };
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const req = {
        headers: { cookie: "session=abc123" },
      } as unknown as Request;

      const result = await resolveNeonAuthSession(req);

      expect(result).not.toBeNull();
      expect(result?.session.id).toBe("sess-1");
      expect(result?.session.userId).toBe("user-1");
      expect(result?.user.id).toBe("user-1");
      expect(result?.user.email).toBe("test@example.com");
      expect(result?.user.name).toBe("Test User");
    });

    it("Test 2: returns null when fetch returns 401", async () => {
      const { resolveNeonAuthSession } = await import("../auth/neon-auth.js");

      const mockResponse = {
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({}),
      };
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const req = {
        headers: { cookie: "session=invalid" },
      } as unknown as Request;

      const result = await resolveNeonAuthSession(req);
      expect(result).toBeNull();
    });

    it("Test 3: returns null when fetch throws network error (does not propagate)", async () => {
      const { resolveNeonAuthSession } = await import("../auth/neon-auth.js");

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Network error"),
      );

      const req = {
        headers: { cookie: "session=abc123" },
      } as unknown as Request;

      const result = await resolveNeonAuthSession(req);
      expect(result).toBeNull();
    });

    it("Test 6: throws config error when NEON_AUTH_BASE_URL is unset", async () => {
      const { resolveNeonAuthSession } = await import("../auth/neon-auth.js");

      delete process.env.NEON_AUTH_BASE_URL;

      const req = {
        headers: { cookie: "session=abc123" },
      } as unknown as Request;

      await expect(resolveNeonAuthSession(req)).rejects.toThrow("NEON_AUTH_BASE_URL is required");
    });
  });

  describe("createNeonAuthProxyHandler", () => {
    it("Test 4: forwards GET to NEON_AUTH_BASE_URL/api/auth/{path} with Cookie header preserved", async () => {
      const { createNeonAuthProxyHandler } = await import("../auth/neon-auth.js");

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        body: null,
        arrayBuffer: vi.fn().mockResolvedValue(Buffer.from(JSON.stringify({ ok: true }))),
      });
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(mockFetch);

      const handler = createNeonAuthProxyHandler();

      const req = {
        method: "GET",
        path: "/api/auth/get-session",
        headers: { cookie: "session=abc123", "content-type": "application/json" },
        body: undefined,
      } as unknown as Request;

      const res = {
        status: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
        end: vi.fn().mockReturnThis(),
      } as any;

      await handler(req, res, vi.fn());

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, fetchOpts] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("neon.example.com");
      expect(url).toContain("/api/auth/get-session");
      expect((fetchOpts.headers as Record<string, string>)["cookie"]).toBe("session=abc123");
    });

    it("Test 5: blocks POST /api/auth/sign-up/email and returns 403", async () => {
      const { createNeonAuthProxyHandler } = await import("../auth/neon-auth.js");

      const handler = createNeonAuthProxyHandler();

      const req = {
        method: "POST",
        path: "/api/auth/sign-up/email",
        headers: {},
        body: { email: "hacker@evil.com", password: "secret" },
      } as unknown as Request;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      await handler(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("Sign-up is disabled") }),
      );
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });
});
