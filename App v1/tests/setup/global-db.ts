import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

const TEST_DB = "test.db";

export default function setup() {
  for (const f of [TEST_DB, `${TEST_DB}-journal`]) rmSync(f, { force: true });
  execSync("pnpm prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: `file:./${TEST_DB}` },
    stdio: "pipe",
  });
  return () => {
    for (const f of [TEST_DB, `${TEST_DB}-journal`]) rmSync(f, { force: true });
  };
}
