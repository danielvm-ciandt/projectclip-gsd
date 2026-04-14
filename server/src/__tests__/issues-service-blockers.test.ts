import { randomUUID } from "node:crypto";
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
    `Skipping embedded Postgres issue service blockers tests on this host: ${embeddedPostgresSupport.reason ?? "unsupported environment"}`,
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

describeEmbeddedPostgres("issueService blockers and dependency wake readiness", () => {
  let db!: ReturnType<typeof createDb>;
  let svc!: ReturnType<typeof issueService>;
  let tempDb: Awaited<ReturnType<typeof startEmbeddedPostgresTestDatabase>> | null = null;

  beforeAll(async () => {
    tempDb = await startEmbeddedPostgresTestDatabase("paperclip-issues-blockers-");
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

  it("persists blocked-by relations and exposes both blockedBy and blocks summaries", async () => {
    const { companyId } = await seedCompanyWithAgent(db);

    const blockerId = randomUUID();
    const blockedId = randomUUID();
    await db.insert(issues).values([
      {
        id: blockerId,
        companyId,
        title: "Blocker",
        status: "todo",
        priority: "high",
      },
      {
        id: blockedId,
        companyId,
        title: "Blocked issue",
        status: "blocked",
        priority: "medium",
      },
    ]);

    await svc.update(blockedId, {
      blockedByIssueIds: [blockerId],
    });

    const blockerRelations = await svc.getRelationSummaries(blockerId);
    const blockedRelations = await svc.getRelationSummaries(blockedId);

    expect(blockerRelations.blocks.map((relation) => relation.id)).toEqual([blockedId]);
    expect(blockedRelations.blockedBy.map((relation) => relation.id)).toEqual([blockerId]);
  });

  it("rejects blocking cycles", async () => {
    const { companyId } = await seedCompanyWithAgent(db);

    const issueA = randomUUID();
    const issueB = randomUUID();
    await db.insert(issues).values([
      { id: issueA, companyId, title: "Issue A", status: "todo", priority: "medium" },
      { id: issueB, companyId, title: "Issue B", status: "todo", priority: "medium" },
    ]);

    await svc.update(issueA, { blockedByIssueIds: [issueB] });

    await expect(
      svc.update(issueB, { blockedByIssueIds: [issueA] }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it("only returns dependents once every blocker is done", async () => {
    const { companyId, agentId } = await seedCompanyWithAgent(db);

    const blockerA = randomUUID();
    const blockerB = randomUUID();
    const blockedIssueId = randomUUID();
    await db.insert(issues).values([
      { id: blockerA, companyId, title: "Blocker A", status: "done", priority: "medium" },
      { id: blockerB, companyId, title: "Blocker B", status: "todo", priority: "medium" },
      {
        id: blockedIssueId,
        companyId,
        title: "Blocked issue",
        status: "blocked",
        priority: "medium",
        assigneeAgentId: agentId,
      },
    ]);

    await svc.update(blockedIssueId, { blockedByIssueIds: [blockerA, blockerB] });

    expect(await svc.listWakeableBlockedDependents(blockerA)).toEqual([]);

    await svc.update(blockerB, { status: "done" });

    await expect(svc.listWakeableBlockedDependents(blockerA)).resolves.toEqual([
      expect.objectContaining({
        id: blockedIssueId,
        assigneeAgentId: agentId,
        blockerIssueIds: expect.arrayContaining([blockerA, blockerB]),
      }),
    ]);
  });

  it("wakes parents only when all direct children are terminal", async () => {
    const { companyId, agentId } = await seedCompanyWithAgent(db);

    const parentId = randomUUID();
    const childA = randomUUID();
    const childB = randomUUID();
    await db.insert(issues).values([
      {
        id: parentId,
        companyId,
        title: "Parent issue",
        status: "todo",
        priority: "medium",
        assigneeAgentId: agentId,
      },
      {
        id: childA,
        companyId,
        parentId,
        title: "Child A",
        status: "done",
        priority: "medium",
      },
      {
        id: childB,
        companyId,
        parentId,
        title: "Child B",
        status: "blocked",
        priority: "medium",
      },
    ]);

    expect(await svc.getWakeableParentAfterChildCompletion(parentId)).toBeNull();

    await svc.update(childB, { status: "cancelled" });

    expect(await svc.getWakeableParentAfterChildCompletion(parentId)).toEqual({
      id: parentId,
      assigneeAgentId: agentId,
      childIssueIds: [childA, childB],
    });
  });
});
