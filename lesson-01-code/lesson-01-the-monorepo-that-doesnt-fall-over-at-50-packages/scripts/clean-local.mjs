#!/usr/bin/env node
// Pretend to be a brand-new laptop or CI runner: delete the LOCAL turbo
// cache and every dist/ folder. Run history (.turbo/runs) is kept so the
// inspector can still show the runs before and after.
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const removed = [];
const remove = (rel) => {
  if (!existsSync(join(ROOT, rel))) return;
  rmSync(join(ROOT, rel), { recursive: true, force: true });
  removed.push(rel);
};
remove(".turbo/cache");
for (const group of ["apps", "packages"]) {
  for (const name of readdirSync(join(ROOT, group))) remove(`${group}/${name}/dist`);
}
console.log(`removed ${removed.length} folder(s): ${removed.join(", ") || "(nothing to remove)"}`);
