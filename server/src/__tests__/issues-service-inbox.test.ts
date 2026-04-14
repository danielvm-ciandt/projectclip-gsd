import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  activityLog,
  agents,
  companies,
  createDb,
  executionWorkspaces,
  instanceSettings,
  issueComments,
  issueInboxArchives,
  issueRelations,
  issues,
  projectWorkspaces,
  projects,
} from "@paperclipai/db";
import {
  getEmbeddedPostgresTestSupport,
  startEmbeddedPostgresTestDatabase,
} from "./helpers/embedded-postgres.js";
import { issueService } from "../services/issues.ts";

const embeddedPostgresSupport = await getEmbeddedPostgresTestSupport();
const describeEmbeddedPostgres = embeddedPostgresSupport.supported ? describe : describe.skip;

if (!embeddedPostgresSupport.supported) {
  console.warn(
    `Skipping embedded Postgres issue service inbox tests on this host: ${embeddedPostgresSupport.reason ?? "unsupported environment"}`,
  );
}

async function seedCompanyWithAgent(db: ReturnType<typeof createDb>) {
  const companyId = randomUUID();
  const agentId = randomUUID();
  const issuePrefix = `T${companyId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;

  await db.insert(companies).values({
    id: companyId,
    name: "Paperclip",
    issuePrefix,
    requireBoardApprovalForNewAgents: false,
  });
  await db.insert(agents).values({
    id: agentId,
    companyId,
    name: "CodexCoder",
    role: "engineer",
    status: "active",
    adapterType: "codex_local",
    adapterConfig: {},
    runtimeConfig: {},
    permissions: {},
  });

  return { companyId, agentId, issuePrefix };
}

describeEmbeddedPostgres("issueService inbox archive and resurface", () => {
  let db!: ReturnType<typeof createDb>;
  let svc!: ReturnType<typeof issueService>;
  let tempDb: Awaited<ReturnType<typeof startEmbeddedPostgresTestDatabase>> | null = null;

  beforeAll(async () => {
    tempDb = await startEmbeddedPostgresTestDatabase("paperclip-issues-inbox-");
    db = createDb(tempDb.connectionString);
    svc = issueService(db);
  }, 60_000);

  afterEach(async () => {
    await db.delete(issueComments);
    await db.delete(issueRelations);
    await db.delete(issueInboxArchives);
    await db.delete(activityLog);
    await db.delete(issues);
    await db.delete(executionWorkspaces);
    await db.delete(projectWorkspaces);
    await db.delete(projects);
    await db.delete(agents);
    await db.delete(instanceSettings);
    await db.delete(companies);
  });

  afterAll(async () => {
    await tempDb?.cleanup();
  });

  it("hides archived inbox issues until new external activity arrives", async () => {
    const { companyId } = await seedCompanyWithAgent(db);
    const userId = "user-1";
    const otherUserId = "user-2";

    const visibleIssueId = randomUUID();
    const archivedIssueId = randomUUID();
    const resurfacedIssueId = randomUUID();

    await db.insert(issues).values([
      {
        id: visibleIssueId,
        companyId,
        title: "Visible issue",
        status: "todo",
        priority: "medium",
        createdByUserId: userId,
        createdAt: new Date("2026-03-26T10:00:00.000Z"),
        updatedAt: new Date("2026-03-26T10:00:00.000Z"),
      },
      {
        id: archivedIssueId,
        companyId,
        title: "Archived issue",
        status: "todo",
        priority: "medium",
        createdByUserId: userId,
        createdAt: new Date("2026-03-26T11:00:00.000Z"),
        updatedAt: new Date("2026-03-26T11:00:00.000Z"),
      },
      {
        id: resurfacedIssueId,
        companyId,
        title: "Resurfaced issue",
        status: "todo",
        priority: "medium",
        createdByUserId: userId,
        createdAt: new Date("2026-03-26T12:00:00.000Z"),
        updatedAt: new Date("2026-03-26T12:00:00.000Z"),
      },
    ]);

    await svc.archiveInbox(companyId, archivedIssueId, userId, new Date("2026-03-26T12:30:00.000Z"));
    await svc.archiveInbox(companyId, resurfacedIssueId, userId, new Date("2026-03-26T13:00:00.000Z"));

    await db.insert(issueComments).values({
      companyId,
      issueId: resurfacedIssueId,
      authorUserId: otherUserId,
      body: "This should bring the issue back into Mine.",
      createdAt: new Date("2026-03-26T13:30:00.000Z"),
      updatedAt: new Date("2026-03-26T13:30:00.000Z"),
    });

    const archivedFiltered = await svc.list(companyId, {
      touchedByUserId: userId,
      inboxArchivedByUserId: userId,
    });

    expect(archivedFiltered.map((issue) => issue.id)).toEqual([
      resurfacedIssueId,
      visibleIssueId,
    ]);

    await svc.unarchiveInbox(companyId, archivedIssueId, userId);

    const afterUnarchive = await svc.list(companyId, {
      touchedByUserId: userId,
      inboxArchivedByUserId: userId,
    });

    expect(new Set(afterUnarchive.map((issue) => issue.id))).toEqual(new Set([
      visibleIssueId,
      archivedIssueId,
      resurfacedIssueId,
    ]));
  });

  it("resurfaces archived issue when status/updatedAt changes after archiving", async () => {
    const { companyId } = await seedCompanyWithAgent(db);
    const userId = "user-1";
    const otherUserId = "user-2";
    const issueId = randomUUID();

    await db.insert(issues).values({
      id: issueId,
      companyId,
      title: "Issue with old comment then status change",
      status: "todo",
      priority: "medium",
      createdByUserId: userId,
      createdAt: new Date("2026-03-26T10:00:00.000Z"),
      updatedAt: new Date("2026-03-26T10:00:00.000Z"),
    });

    await db.insert(issueComments).values({
      companyId,
      issueId,
      authorUserId: otherUserId,
      body: "Old comment before archive",
      createdAt: new Date("2026-03-26T11:00:00.000Z"),
      updatedAt: new Date("2026-03-26T11:00:00.000Z"),
    });

    await svc.archiveInbox(companyId, issueId, userId, new Date("2026-03-26T12:00:00.000Z"));

    const afterArchive = await svc.list(companyId, {
      touchedByUserId: userId,
      inboxArchivedByUserId: userId,
    });
    expect(afterArchive.map((i) => i.id)).not.toContain(issueId);

    await db
      .update(issues)
      .set({
        status: "in_progress",
        updatedAt: new Date("2026-03-26T13:00:00.000Z"),
      })
      .where(eq(issues.id, issueId));

    const afterUpdate = await svc.list(companyId, {
      touchedByUserId: userId,
      inboxArchivedByUserId: userId,
    });
    expect(afterUpdate.map((i) => i.id)).toContain(issueId);
  });

  it("sorts and exposes last activity from comments and non-local issue activity logs", async () => {
    const { companyId } = await seedCompanyWithAgent(db);
    const olderIssueId = randomUUID();
    const commentIssueId = randomUUID();
    const activityIssueId = randomUUID();

    await db.insert(issues).values([
      {
        id: olderIssueId,
        companyId,
        title: "Older issue",
        status: "todo",
        priority: "medium",
        updatedAt: new Date("2026-03-26T10:00:00.000Z"),
      },
      {
        id: commentIssueId,
        companyId,
        title: "Comment activity issue",
        status: "todo",
        priority: "medium",
        updatedAt: new Date("2026-03-26T10:00:00.000Z"),
      },
      {
        id: activityIssueId,
        companyId,
        title: "Logged activity issue",
        status: "todo",
        priority: "medium",
        updatedAt: new Date("2026-03-26T10:00:00.000Z"),
      },
    ]);

    await db.insert(issueComments).values({
      companyId,
      issueId: commentIssueId,
      body: "New comment without touching issue.updatedAt",
      createdAt: new Date("2026-03-26T11:00:00.000Z"),
      updatedAt: new Date("2026-03-26T11:00:00.000Z"),
    });

    await db.insert(activityLog).values([
      {
        companyId,
        actorType: "system",
        actorId: "system",
        action: "issue.document_updated",
        entityType: "issue",
        entityId: activityIssueId,
        createdAt: new Date("2026-03-26T12:00:00.000Z"),
      },
      {
        companyId,
        actorType: "user",
        actorId: "user-1",
        action: "issue.read_marked",
        entityType: "issue",
        entityId: olderIssueId,
        createdAt: new Date("2026-03-26T13:00:00.000Z"),
      },
    ]);

    const result = await svc.list(companyId, {});

    expect(result.map((issue) => issue.id)).toEqual([
      activityIssueId,
      commentIssueId,
      olderIssueId,
    ]);
    expect(result.find((issue) => issue.id === activityIssueId)?.lastActivityAt?.toISOString()).toBe(
      "2026-03-26T12:00:00.000Z",
    );
    expect(result.find((issue) => issue.id === commentIssueId)?.lastActivityAt?.toISOString()).toBe(
      "2026-03-26T11:00:00.000Z",
    );
    expect(result.find((issue) => issue.id === olderIssueId)?.lastActivityAt?.toISOString()).toBe(
      "2026-03-26T10:00:00.000Z",
    );
  });
});
