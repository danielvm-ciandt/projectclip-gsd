import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
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
  activityLog,
} from "@paperclipai/db";
import {
  getEmbeddedPostgresTestSupport,
  startEmbeddedPostgresTestDatabase,
} from "./helpers/embedded-postgres.js";
import { instanceSettingsService } from "../services/instance-settings.ts";
import { issueService } from "../services/issues.ts";

const embeddedPostgresSupport = await getEmbeddedPostgresTestSupport();
const describeEmbeddedPostgres = embeddedPostgresSupport.supported ? describe : describe.skip;

if (!embeddedPostgresSupport.supported) {
  console.warn(
    `Skipping embedded Postgres issue service create tests on this host: ${embeddedPostgresSupport.reason ?? "unsupported environment"}`,
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

describeEmbeddedPostgres("issueService.create workspace inheritance", () => {
  let db!: ReturnType<typeof createDb>;
  let svc!: ReturnType<typeof issueService>;
  let tempDb: Awaited<ReturnType<typeof startEmbeddedPostgresTestDatabase>> | null = null;

  beforeAll(async () => {
    tempDb = await startEmbeddedPostgresTestDatabase("paperclip-issues-create-");
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

  it("inherits the parent issue workspace linkage when child workspace fields are omitted", async () => {
    const { companyId } = await seedCompanyWithAgent(db);
    const projectId = randomUUID();
    const parentIssueId = randomUUID();
    const projectWorkspaceId = randomUUID();
    const executionWorkspaceId = randomUUID();

    await instanceSettingsService(db).updateExperimental({ enableIsolatedWorkspaces: true });

    await db.insert(projects).values({
      id: projectId,
      companyId,
      name: "Workspace project",
      status: "in_progress",
    });

    await db.insert(projectWorkspaces).values({
      id: projectWorkspaceId,
      companyId,
      projectId,
      name: "Primary workspace",
      isPrimary: true,
      sharedWorkspaceKey: "workspace-key",
    });

    await db.insert(executionWorkspaces).values({
      id: executionWorkspaceId,
      companyId,
      projectId,
      projectWorkspaceId,
      mode: "isolated_workspace",
      strategyType: "git_worktree",
      name: "Issue worktree",
      status: "active",
      providerType: "git_worktree",
      providerRef: `/tmp/${executionWorkspaceId}`,
    });

    await db.insert(issues).values({
      id: parentIssueId,
      companyId,
      projectId,
      projectWorkspaceId,
      title: "Parent issue",
      status: "in_progress",
      priority: "medium",
      executionWorkspaceId,
      executionWorkspacePreference: "reuse_existing",
      executionWorkspaceSettings: {
        mode: "isolated_workspace",
        workspaceRuntime: { profile: "agent" },
      },
    });

    const child = await svc.create(companyId, {
      parentId: parentIssueId,
      projectId,
      title: "Child issue",
    });

    expect(child.parentId).toBe(parentIssueId);
    expect(child.projectWorkspaceId).toBe(projectWorkspaceId);
    expect(child.executionWorkspaceId).toBe(executionWorkspaceId);
    expect(child.executionWorkspacePreference).toBe("reuse_existing");
    expect(child.executionWorkspaceSettings).toEqual({
      mode: "isolated_workspace",
      workspaceRuntime: { profile: "agent" },
    });
  });

  it("keeps explicit workspace fields instead of inheriting the parent linkage", async () => {
    const { companyId } = await seedCompanyWithAgent(db);
    const projectId = randomUUID();
    const parentIssueId = randomUUID();
    const parentProjectWorkspaceId = randomUUID();
    const parentExecutionWorkspaceId = randomUUID();
    const explicitProjectWorkspaceId = randomUUID();
    const explicitExecutionWorkspaceId = randomUUID();

    await instanceSettingsService(db).updateExperimental({ enableIsolatedWorkspaces: true });

    await db.insert(projects).values({
      id: projectId,
      companyId,
      name: "Workspace project",
      status: "in_progress",
    });

    await db.insert(projectWorkspaces).values([
      {
        id: parentProjectWorkspaceId,
        companyId,
        projectId,
        name: "Parent workspace",
      },
      {
        id: explicitProjectWorkspaceId,
        companyId,
        projectId,
        name: "Explicit workspace",
      },
    ]);

    await db.insert(executionWorkspaces).values([
      {
        id: parentExecutionWorkspaceId,
        companyId,
        projectId,
        projectWorkspaceId: parentProjectWorkspaceId,
        mode: "isolated_workspace",
        strategyType: "git_worktree",
        name: "Parent worktree",
        status: "active",
        providerType: "git_worktree",
      },
      {
        id: explicitExecutionWorkspaceId,
        companyId,
        projectId,
        projectWorkspaceId: explicitProjectWorkspaceId,
        mode: "shared_workspace",
        strategyType: "project_primary",
        name: "Explicit shared workspace",
        status: "active",
        providerType: "local_fs",
      },
    ]);

    await db.insert(issues).values({
      id: parentIssueId,
      companyId,
      projectId,
      projectWorkspaceId: parentProjectWorkspaceId,
      title: "Parent issue",
      status: "in_progress",
      priority: "medium",
      executionWorkspaceId: parentExecutionWorkspaceId,
      executionWorkspacePreference: "reuse_existing",
      executionWorkspaceSettings: {
        mode: "isolated_workspace",
      },
    });

    const child = await svc.create(companyId, {
      parentId: parentIssueId,
      projectId,
      title: "Child issue",
      projectWorkspaceId: explicitProjectWorkspaceId,
      executionWorkspaceId: explicitExecutionWorkspaceId,
      executionWorkspacePreference: "reuse_existing",
      executionWorkspaceSettings: {
        mode: "shared_workspace",
      },
    });

    expect(child.projectWorkspaceId).toBe(explicitProjectWorkspaceId);
    expect(child.executionWorkspaceId).toBe(explicitExecutionWorkspaceId);
    expect(child.executionWorkspacePreference).toBe("reuse_existing");
    expect(child.executionWorkspaceSettings).toEqual({
      mode: "shared_workspace",
    });
  });

  it("inherits workspace linkage from an explicit source issue without creating a parent-child relationship", async () => {
    const { companyId } = await seedCompanyWithAgent(db);
    const projectId = randomUUID();
    const sourceIssueId = randomUUID();
    const projectWorkspaceId = randomUUID();
    const executionWorkspaceId = randomUUID();

    await instanceSettingsService(db).updateExperimental({ enableIsolatedWorkspaces: true });

    await db.insert(projects).values({
      id: projectId,
      companyId,
      name: "Workspace project",
      status: "in_progress",
    });

    await db.insert(projectWorkspaces).values({
      id: projectWorkspaceId,
      companyId,
      projectId,
      name: "Primary workspace",
    });

    await db.insert(executionWorkspaces).values({
      id: executionWorkspaceId,
      companyId,
      projectId,
      projectWorkspaceId,
      mode: "operator_branch",
      strategyType: "git_worktree",
      name: "Operator branch",
      status: "active",
      providerType: "git_worktree",
    });

    await db.insert(issues).values({
      id: sourceIssueId,
      companyId,
      projectId,
      projectWorkspaceId,
      title: "Source issue",
      status: "todo",
      priority: "medium",
      executionWorkspaceId,
      executionWorkspacePreference: "reuse_existing",
      executionWorkspaceSettings: {
        mode: "operator_branch",
      },
    });

    const followUp = await svc.create(companyId, {
      projectId,
      title: "Follow-up issue",
      inheritExecutionWorkspaceFromIssueId: sourceIssueId,
    });

    expect(followUp.parentId).toBeNull();
    expect(followUp.projectWorkspaceId).toBe(projectWorkspaceId);
    expect(followUp.executionWorkspaceId).toBe(executionWorkspaceId);
    expect(followUp.executionWorkspacePreference).toBe("reuse_existing");
    expect(followUp.executionWorkspaceSettings).toEqual({
      mode: "operator_branch",
    });
  });
});
