import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: projectRoot,
  resolve: { conditions: ["node"] },
  test: {
    name: "phase-validation",
    environment: "node",
    maxWorkers: 1,
    testTimeout: 60_000,
    hookTimeout: 30_000,
    include: ["**/*.test.ts"],
  },
});
