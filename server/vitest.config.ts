import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    maxWorkers: 2,
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
