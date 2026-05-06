import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["src/**/*.test.ts"],
    // DAO tests boot mongodb-memory-server. Running multiple test files
    // in parallel makes the Mongo instances race for ports / binary
    // locks, leading to flaky 60s timeouts. Serializing file execution
    // costs ~2-3s overall and removes the flakiness entirely.
    fileParallelism: false,
  },
});
