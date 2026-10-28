import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/setup/global-db.ts"],
    env: {
      DATABASE_URL: "file:./test.db",
      APP_URL: "http://localhost:3000",
      JWT_SECRET: "secreto-solo-para-tests-0123456789-abcdefghij",
    },
    fileParallelism: false,
  },
});
