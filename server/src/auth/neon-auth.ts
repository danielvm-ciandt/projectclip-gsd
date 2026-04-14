import type { Request, RequestHandler } from "express";
import { logger } from "../middleware/logger.js";

export type NeonAuthSessionResult = {
  session: { id: string; userId: string; expiresAt?: Date };
  user: { id: string; email: string; name: string; image?: string | null };
};

function getNeonAuthBaseUrl(): string {
  const url = process.env.NEON_AUTH_BASE_URL;
  if (!url) {
    throw new Error("NEON_AUTH_BASE_URL is required");
  }
  return url;
}

export async function resolveNeonAuthSession(req: Request): Promise<NeonAuthSessionResult | null> {
  const baseUrl = getNeonAuthBaseUrl();

  try {
    const response = await globalThis.fetch(`${baseUrl}/api/auth/get-session`, {
      method: "GET",
      headers: {
        ...(req.headers.cookie ? { cookie: req.headers.cookie } : {}),
      },
    });

    if (!response.ok) {
      return null;
    }

    const body = await response.json() as Record<string, unknown>;
    if (!body || typeof body !== "object") {
      return null;
    }

    const sessionRaw = body.session as Record<string, unknown> | null | undefined;
    const userRaw = body.user as Record<string, unknown> | null | undefined;

    if (!sessionRaw?.id || !sessionRaw?.userId || !userRaw?.id) {
      return null;
    }

    const expiresAtRaw = sessionRaw.expiresAt;
    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw as string) : undefined;

    return {
      session: {
        id: sessionRaw.id as string,
        userId: sessionRaw.userId as string,
        ...(expiresAt ? { expiresAt } : {}),
      },
      user: {
        id: userRaw.id as string,
        email: (userRaw.email as string) ?? "",
        name: (userRaw.name as string) ?? "",
        image: (userRaw.image as string | null | undefined) ?? null,
      },
    };
  } catch (err) {
    logger.warn({ err }, "Neon Auth session resolution failed");
    return null;
  }
}

export function createNeonAuthProxyHandler(): RequestHandler {
  // Validate config at handler creation time
  const baseUrl = getNeonAuthBaseUrl();

  return async (req, res, next) => {
    try {
      // D-05 API gate: block public sign-up
      if (req.method === "POST" && req.path === "/api/auth/sign-up/email") {
        res.status(403).json({
          error: "Sign-up is disabled. Contact your administrator.",
        });
        return;
      }

      const upstreamUrl = `${baseUrl}${req.path}`;

      const headers: Record<string, string> = {};
      if (req.headers.cookie) {
        headers["cookie"] = req.headers.cookie;
      }
      if (req.headers["content-type"]) {
        headers["content-type"] = req.headers["content-type"] as string;
      }

      const hasBody = req.body !== undefined && req.body !== null;
      const bodyPayload =
        hasBody && req.method !== "GET" && req.method !== "HEAD"
          ? JSON.stringify(req.body)
          : undefined;

      const upstreamResponse = await globalThis.fetch(upstreamUrl, {
        method: req.method,
        headers,
        ...(bodyPayload ? { body: bodyPayload } : {}),
      });

      // T-02-05: strip verbose upstream error bodies — return generic status
      res.status(upstreamResponse.status);

      // Forward safe response headers from upstream
      const FORWARDED_HEADERS = [
        "content-type",
        "set-cookie",
        "cache-control",
        "location",
      ];
      for (const headerName of FORWARDED_HEADERS) {
        const value = upstreamResponse.headers.get(headerName);
        if (value) {
          res.set(headerName, value);
        }
      }

      const responseBody = await upstreamResponse.arrayBuffer();
      res.send(Buffer.from(responseBody));
    } catch (err) {
      next(err);
    }
  };
}
