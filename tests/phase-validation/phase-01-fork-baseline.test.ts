import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("Phase 01 — Plan 01-01 (import, FORK_DIFF, migrate)", () => {
  it("satisfies BOOT-01 layout: root package manifest and db workspace", () => {
    expect(existsSync(join(repoRoot, "package.json"))).toBe(true);
    expect(existsSync(join(repoRoot, "pnpm-workspace.yaml"))).toBe(true);
    expect(existsSync(join(repoRoot, "packages", "db", "package.json"))).toBe(true);
    const rootPkg = readRepoFile("package.json");
    expect(rootPkg).toContain('"name": "paperclip"');
  });

  it("satisfies BOOT-07 stub: FORK_DIFF has required sections and branch story", () => {
    const fork = readRepoFile("FORK_DIFF.md");
    expect(fork).toMatch(/##\s+Provenance/);
    expect(fork).toMatch(/##\s+Default branch/);
    expect(fork.toLowerCase()).toContain("main");
    expect(fork.toLowerCase()).toContain("master");
  });

  it("exposes db:migrate for Drizzle (runtime migrate is manual / CI)", () => {
    const rootPkg = readRepoFile("package.json");
    expect(rootPkg).toContain('"db:migrate"');
    expect(rootPkg).toContain("pnpm --filter @paperclipai/db migrate");
  });
});

describe("Phase 01 — Plan 01-02 (quality gate scripts)", () => {
  it("BOOT-02..BOOT-05: root scripts list typecheck, test:run, build, test:e2e", () => {
    const rootPkg = readRepoFile("package.json");
    expect(rootPkg).toContain('"typecheck"');
    expect(rootPkg).toContain('"test:run"');
    expect(rootPkg).toContain('"build"');
    expect(rootPkg).toContain('"test:e2e"');
  });

  it("BOOT-03: Vitest workspace config exists", () => {
    expect(existsSync(join(repoRoot, "vitest.config.ts"))).toBe(true);
  });

  it("BOOT-05: Playwright e2e config exists", () => {
    expect(existsSync(join(repoRoot, "tests", "e2e", "playwright.config.ts"))).toBe(true);
  });
});

describe("Phase 01 — Plan 01-03 (CI on main)", () => {
  it("QUAL-01 / D-03: PR workflow exists with frozen install and e2e LLM skip", () => {
    const pr = readRepoFile(".github/workflows/pr.yml");
    expect(pr).toContain("pnpm install --frozen-lockfile");
    expect(pr).toContain("PAPERCLIP_E2E_SKIP_LLM");
    expect(pr).toContain("main");
  });

  it("D-03: dispatch e2e and release workflows exist on main", () => {
    expect(existsSync(join(repoRoot, ".github", "workflows", "e2e.yml"))).toBe(true);
    expect(existsSync(join(repoRoot, ".github", "workflows", "release.yml"))).toBe(true);
    const release = readRepoFile(".github/workflows/release.yml");
    expect(release).toContain("main");
    const e2e = readRepoFile(".github/workflows/e2e.yml");
    expect(e2e).toContain("workflow_dispatch");
  });

  it("BOOT-07: FORK_DIFF documents CI phase and QUAL-01", () => {
    const fork = readRepoFile("FORK_DIFF.md");
    expect(fork).toMatch(/##\s+CI workflows \(Phase 1\)/);
    expect(
      fork.includes("QUAL-01") || fork.includes("frozen-lockfile"),
    ).toBe(true);
  });
});

describe("Phase 01 — Plan 01-04 (semantic-release dry-run)", () => {
  it("QUAL-02: angular preset and private npm publish guard in .releaserc.json", () => {
    const cfg = readRepoFile(".releaserc.json");
    expect(cfg).toContain('"angular"');
    expect(cfg).toContain('"npmPublish": false');
    expect(cfg).toContain('"branches"');
  });

  it("BOOT-06 / D-06: semantic-release workflow is push-to-main dry-run only", () => {
    const wf = readRepoFile(".github/workflows/semantic-release.yml");
    expect(wf).toContain("npx semantic-release --dry-run");
    expect(wf).toContain("branches:");
    expect(wf).toContain("- main");
    expect(wf).not.toMatch(/pull_request:\s*$/m);
  });

  it("BOOT-07 / D-07: FORK_DIFF documents dual path and v0.0.1", () => {
    const fork = readRepoFile("FORK_DIFF.md");
    expect(fork).toMatch(/##\s+Release tooling — dual path \(Phase 1\)/);
    expect(fork).toContain("semantic-release");
    expect(fork).toContain("release.sh");
    expect(fork).toContain("v0.0.1");
  });

  it("root package lists semantic-release tooling", () => {
    const rootPkg = readRepoFile("package.json");
    expect(rootPkg).toContain("semantic-release");
    expect(rootPkg).toContain("@semantic-release/commit-analyzer");
  });
});
