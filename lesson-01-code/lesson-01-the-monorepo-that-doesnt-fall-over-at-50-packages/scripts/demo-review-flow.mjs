#!/usr/bin/env node
// Carried forward from Lesson 0 unchanged (now `pnpm review:demo`).
// Walks the fixture PRs through the real validator and prints what a
// reviewer would see.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validatePrDescription } from "./validate-pr-description.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FIXTURES_DIR = join(ROOT, "fixtures", "pr-bodies");

console.log("Pulse platform — PR review simulation (Lesson 0)\n" + "=".repeat(50));

for (const file of readdirSync(FIXTURES_DIR).sort()) {
  const fullPath = join(FIXTURES_DIR, file);
  const body = readFileSync(fullPath, "utf-8");
  const result = validatePrDescription(body, { root: ROOT });

  console.log(`\n--- fixtures/pr-bodies/${file} ---`);
  if (result.ok) {
    console.log(`✓ MERGEABLE — Blast Radius: ${result.blastRadius.join(", ")}`);
    console.log(`  Approvals satisfied: ${result.requiredTeams.join(", ") || "(single-team, no cross-team approval needed)"}`);
  } else {
    console.log("✗ BLOCKED —");
    for (const err of result.errors) console.log(`    - ${err}`);
  }
}

console.log("\n" + "=".repeat(50));
console.log("This is the mechanism from the lesson's architecture decision:");
console.log("the review process itself enforces package boundaries, automatically.");
