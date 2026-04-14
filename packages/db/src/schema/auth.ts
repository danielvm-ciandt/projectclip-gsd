/**
 * Auth schema strategy: When PAPERCLIP_AUTH_PROVIDER=neon, these tables are managed
 * by Neon Auth under the neon_auth Postgres schema. They are NOT created by Drizzle
 * migrations in that mode. See FORK_DIFF.md for migration strategy (AUTH-05).
 *
 * authUsers maps to neon_auth.users_sync — the Neon Auth user sync table.
 * authSessions, authAccounts, authVerifications are retained for the legacy
 * better-auth path (PAPERCLIP_AUTH_PROVIDER=better-auth); they are not used
 * when Neon Auth is active.
 */
import { pgSchema, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// neon_auth schema — owned and managed by Neon Auth, not by Drizzle migrations
const neonAuthSchema = pgSchema("neon_auth");

/**
 * Read-only reference to the Neon Auth user sync table.
 * Used for cross-schema reads (e.g. join user name/email alongside API keys).
 * Do NOT include in Drizzle push/migrate when PAPERCLIP_AUTH_PROVIDER=neon.
 * @deprecated Drizzle no longer owns this table when Neon Auth is active.
 */
export const authUsers = neonAuthSchema.table("users_sync", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Legacy Better Auth tables (PAPERCLIP_AUTH_PROVIDER=better-auth only)
// These tables are in the public schema and managed by Drizzle migrations.
// They are NOT used when Neon Auth is active — Neon Auth owns its own
// session/account/verification records in the neon_auth schema.
// ---------------------------------------------------------------------------

export const authSessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull(),
});

export const authAccounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const authVerifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});
