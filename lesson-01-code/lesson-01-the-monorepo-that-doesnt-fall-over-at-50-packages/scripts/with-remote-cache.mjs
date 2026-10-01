#!/usr/bin/env node
// Runs a turbo command pointed at the Pulse remote cache.
//   node scripts/with-remote-cache.mjs run build --summarize
// Same three settings a CI runner would get from its secrets store —
// written as a Node wrapper so the command works on macOS, Linux and Windows.
import { spawnSync } from "node:child_process";
import { DEFAULT_PORT, DEV_TOKEN } from "./remote-cache-server.mjs";

const env = {
  ...process.env,
  TURBO_API: process.env.TURBO_API ?? `http://localhost:${DEFAULT_PORT}`,
  TURBO_TOKEN: process.env.TURBO_TOKEN ?? DEV_TOKEN,
  TURBO_TEAM: process.env.TURBO_TEAM ?? "pulse",
};
const result = spawnSync("turbo", process.argv.slice(2), { stdio: "inherit", env, shell: process.platform === "win32" });
process.exit(result.status ?? 1);
