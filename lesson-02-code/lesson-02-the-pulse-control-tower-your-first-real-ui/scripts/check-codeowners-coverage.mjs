#!/usr/bin/env node
// Carried forward from Lesson 0 unchanged.
// Fails (exit 1) if any apps/* or packages/* directory has no CODEOWNERS
// entry. This is the CI check that stops boundary drift: someone scaffolds
// a new package and forgets to declare who owns it.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

export function listPackageDirs(root = ROOT) {
  const dirs = [];
  for (const group of ["apps", "packages"]) {
    const groupPath = join(root, group);
    if (!existsSync(groupPath)) continue;
    for (const entry of readdirSync(groupPath, { withFileTypes: true })) {
      if (entry.isDirectory()) dirs.push(`${group}/${entry.name}/`);
    }
  }
  return dirs.sort();
}

export function parseCodeowners(text) {
  // Returns a map of "path/" -> ["@team1", "@team2", ...]
  const entries = new Map();
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const [path, ...teams] = line.split(/\s+/);
    if (!path.startsWith("apps/") && !path.startsWith("packages/")) continue;
    entries.set(path, teams);
  }
  return entries;
}

export function findUncoveredPackages(packageDirs, codeownersEntries) {
  return packageDirs.filter((dir) => !codeownersEntries.has(dir));
}

function main() {
  const codeownersPath = join(ROOT, ".github", "CODEOWNERS");
  if (!existsSync(codeownersPath)) {
    console.error("FAIL: .github/CODEOWNERS does not exist.");
    process.exit(1);
  }

  const codeownersText = readFileSync(codeownersPath, "utf-8");
  const entries = parseCodeowners(codeownersText);
  const packageDirs = listPackageDirs();
  const uncovered = findUncoveredPackages(packageDirs, entries);

  if (uncovered.length > 0) {
    console.error("FAIL: the following packages have no CODEOWNERS entry:");
    for (const dir of uncovered) console.error(`  - ${dir}`);
    process.exit(1);
  }

  console.log(
    `OK: all ${packageDirs.length} packages (${packageDirs.join(", ")}) have CODEOWNERS coverage.`
  );
}

// Only run when executed directly (not when imported by tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
