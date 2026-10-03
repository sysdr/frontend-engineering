#!/usr/bin/env node
// Carried forward from Lesson 1 unchanged.
// Installs a git pre-commit hook that runs the boundary lint on affected
// packages only — so a boundary-violating import is stopped on the
// author's own machine, before a reviewer ever sees it.
import { chmodSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const hooksDir = join(ROOT, ".git", "hooks");
if (!existsSync(hooksDir)) {
  console.error("FAIL: no .git/hooks folder — run `git init` first (see VERIFY.md).");
  process.exit(1);
}
const hook = `#!/bin/sh
# Installed by pnpm hooks:install (Lesson 1)
echo "pre-commit: boundary lint on affected packages"
pnpm exec turbo run lint --affected --output-logs=errors-only || {
  echo "pre-commit: blocked — fix the import above, or it would fail CI anyway."
  exit 1
}
`;
const target = join(hooksDir, "pre-commit");
writeFileSync(target, hook);
chmodSync(target, 0o755);
console.log(`OK: installed ${target.slice(ROOT.length + 1)}`);
