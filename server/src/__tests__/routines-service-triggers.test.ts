import { createHmac, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  activityLog,
  agents,
  companies,
  companySecrets,
  companySecretVersions,
  createDb,
  executionWorkspaces,
  heartbeatRuns,
  instanceSettings,
  issues,
  projectWorkspaces,
  projects,
  routineRuns,
  routines,
  routineTriggers,
} from "@paperclipai/db";
import {
  getEmbeddedPostgresTestSupport,
  startEmbeddedPostgresTestDatabase,
} from "./helpers/embedded-postgres.js";
import { issueService } from "../services/issues.ts";
import { routineService } from "../services/routines.ts";

const embeddedPostgresSupport = await getEmbeddedPostgresTestSupport();
const describeEmbeddedPostgres = embeddedPostgresSupport.supported ? describe : describe.skip;

if (!embeddedPostgresSupport.supported) {
  console.warn(
    `Skipping embedded Postgres routines trigger tests on this host: ${embeddedPostgresSupport.reason ?? "unsupported environment"}`,
  );
}

describeEmbeddedPostgres("routine service trigger validation and webhook signing", () => {
  let db!: ReturnType<typeof createDb>;
  let tempDb: Awaited<ReturnType<typeof startEmbeddedPostgresTestDatabase>> | null = null;

  beforeAll(async () => {
    tempDb = await startEmbeddedPostgresTestDatabase("paperclip-routines-triggers-");
    db = createDb(tempDb.connectionString);
  }, 60_000);

  afterEach(async () => {
    await db.delete(activityLog);
    await db.delete(routineRuns);
    await db.delete(routineTriggers);
    await db.delete(routines);
    await db.delete(companySecretVersions);
    await db.delete(companySecrets);
    await db.delete(heartbeatRuns);
    await db.delete(issues);
    await db.delete(executionWorkspaces);
    await db.delete(projectWorkspaces);
    await db.delete(projects);
    await db.delete(agents);
    await db.delete(companies);
    await db.delete(instanceSettings);
  });

  afterAll(async () => {
    await tempDb?.cleanup();
  });

  async function seedFixture() {
    const companyId = randomUUID();
    const agentId = randomUUID();
    const projectId = randomUUID();
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

    await db.insert(projects).values({
      id: projectId,
      companyId,
      name: "Routines",
      status: "in_progress",
    });

    const svc = routineService(db, {
      heartbeat: {
        wakeup: async (wakeupAgentId, wakeupOpts) => {
          const issueId =
            (typeof wakeupOpts.payload?.issueId === "string" && wakeupOpts.payload.issueId) ||
            (typeof wakeupOpts.contextSnapshot?.issueId === "string" && wakeupOpts.contextSnapshot.issueId) ||
            null;
          if (!issueId) return null;
          const queuedRunId = randomUUID();
          await db.insert(heartbeatRuns).values({
            id: queuedRunId,
            companyId,
            agentId: wakeupAgentId,
            invocationSource: wakeupOpts.source ?? "assignment",
            triggerDetail: wakeupOpts.triggerDetail ?? null,
            status: "queued",
            contextSnapshot: { ...(wakeupOpts.contextSnapshot ?? {}), issueId },
          });
          await db
            .update(issues)
            .set({
              executionRunId: queuedRunId,
              executionLockedAt: new Date(),
            })
            .where(eq(issues.id, issueId));
          return { id: queuedRunId };
        },
      },
    });
    const issueSvc = issueService(db);
    const routine = await svc.create(
      companyId,
      {
        projectId,
        goalId: null,
        parentIssueId: null,
        title: "ascii frog",
        description: "Run the frog routine",
        assigneeAgentId: agentId,
        priority: "medium",
        status: "active",
        concurrencyPolicy: "coalesce_if_active",
        catchUpPolicy: "skip_missed",
      },
      {},
    );

    return { companyId, agentId, issueSvc, projectId, routine, svc };
  }

  it("blocks schedule triggers when required variables do not have defaults", async () => {
    const { companyId, agentId, projectId, svc } = await seedFixture();
    const variableRoutine = await svc.create(
      companyId,
      {
        projectId,
        goalId: null,
        parentIssueId: null,
        title: "repo triage",
        description: "Review {{repo}}",
        assigneeAgentId: agentId,
        priority: "medium",
        status: "active",
        concurrencyPolicy: "coalesce_if_active",
        catchUpPolicy: "skip_missed",
        variables: [
          { name: "repo", label: null, type: "text", defaultValue: null, required: true, options: [] },
        ],
      },
      {},
    );

    await expect(
      svc.createTrigger(variableRoutine.id, {
        kind: "schedule",
        label: "daily",
        cronExpression: "0 10 * * *",
        timezone: "UTC",
      }, {}),
    ).rejects.toThrow(/require defaults for required variables/i);
  });

  it("treats malformed stored defaults as missing when validating schedule triggers", async () => {
    const { companyId, agentId, projectId, svc } = await seedFixture();
    const variableRoutine = await svc.create(
      companyId,
      {
        projectId,
        goalId: null,
        parentIssueId: null,
        title: "ship check",
        description: "Review {{approved}}",
        assigneeAgentId: agentId,
        priority: "medium",
        status: "active",
        concurrencyPolicy: "coalesce_if_active",
        catchUpPolicy: "skip_missed",
        variables: [
          { name: "approved", label: null, type: "boolean", defaultValue: true, required: true, options: [] },
        ],
      },
      {},
    );

    await db
      .update(routines)
      .set({
        variables: [
          {
            name: "approved",
            label: null,
            type: "boolean",
            defaultValue: "definitely",
            required: true,
            options: [],
          },
        ],
      })
      .where(eq(routines.id, variableRoutine.id));

    await expect(
      svc.createTrigger(variableRoutine.id, {
        kind: "schedule",
        label: "daily",
        cronExpression: "0 10 * * *",
        timezone: "UTC",
      }, {}),
    ).rejects.toThrow(/require defaults for required variables/i);
  });

  it("accepts standard second-precision webhook timestamps for HMAC triggers", async () => {
    const { routine, svc } = await seedFixture();
    const { trigger, secretMaterial } = await svc.createTrigger(
      routine.id,
      {
        kind: "webhook",
        signingMode: "hmac_sha256",
        replayWindowSec: 300,
      },
      {},
    );

    expect(trigger.publicId).toBeTruthy();
    expect(secretMaterial?.webhookSecret).toBeTruthy();

    const payload = { ok: true };
    const rawBody = Buffer.from(JSON.stringify(payload));
    const timestampSeconds = String(Math.floor(Date.now() / 1000));
    const signature = `sha256=${createHmac("sha256", secretMaterial!.webhookSecret)
      .update(`${timestampSeconds}.`)
      .update(rawBody)
      .digest("hex")}`;

    const run = await svc.firePublicTrigger(trigger.publicId!, {
      signatureHeader: signature,
      timestampHeader: timestampSeconds,
      rawBody,
      payload,
    });

    expect(run.source).toBe("webhook");
    expect(run.status).toBe("issue_created");
    expect(run.linkedIssueId).toBeTruthy();
  });

  it("accepts GitHub-style X-Hub-Signature-256 with github_hmac signing mode", async () => {
    const { routine, svc } = await seedFixture();
    const { trigger, secretMaterial } = await svc.createTrigger(
      routine.id,
      {
        kind: "webhook",
        signingMode: "github_hmac",
      },
      {},
    );

    const payload = { action: "opened", pull_request: { number: 1 } };
    const rawBody = Buffer.from(JSON.stringify(payload));
    const signature = `sha256=${createHmac("sha256", secretMaterial!.webhookSecret)
      .update(rawBody)
      .digest("hex")}`;

    const run = await svc.firePublicTrigger(trigger.publicId!, {
      hubSignatureHeader: signature,
      rawBody,
      payload,
    });

    expect(run.source).toBe("webhook");
    expect(run.status).toBe("issue_created");
  });

  it("rejects invalid signature for github_hmac signing mode", async () => {
    const { routine, svc } = await seedFixture();
    const { trigger } = await svc.createTrigger(
      routine.id,
      {
        kind: "webhook",
        signingMode: "github_hmac",
      },
      {},
    );

    const rawBody = Buffer.from(JSON.stringify({ ok: true }));

    await expect(
      svc.firePublicTrigger(trigger.publicId!, {
        hubSignatureHeader: "sha256=0000000000000000000000000000000000000000000000000000000000000000",
        rawBody,
        payload: { ok: true },
      }),
    ).rejects.toThrow();
  });

  it("accepts any request with none signing mode", async () => {
    const { routine, svc } = await seedFixture();
    const { trigger } = await svc.createTrigger(
      routine.id,
      {
        kind: "webhook",
        signingMode: "none",
      },
      {},
    );

    const run = await svc.firePublicTrigger(trigger.publicId!, {
      payload: { event: "error.created" },
    });

    expect(run.source).toBe("webhook");
    expect(run.status).toBe("issue_created");
  });
});
