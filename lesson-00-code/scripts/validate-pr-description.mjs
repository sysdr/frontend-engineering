#!/usr/bin/env node
// Validates a PR description (a markdown file, standing in for a real PR
// body from the GitHub API) against Lesson 0's rule:
//   - a "## Blast Radius" section must list at least one real package path
//   - every package listed must actually exist in the repo
//   - if any listed package is a SHARED package, every team CODEOWNERS
//     requires for that path must appear in "## Approvals" before this
//     validator will pass — this is the "review process enforces the
//     architecture boundary" rule from the lesson, made executable.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCodeowners, listPackageDirs } from "./check-codeowners-coverage.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

export function extractSection(prBody, heading) {
  const lines = prBody.split("\n");
  const startIdx = lines.findIndex((l) => l.trim() === heading);
  if (startIdx === -1) return null;
  const rest = lines.slice(startIdx + 1);
  const nextHeadingIdx = rest.findIndex((l) => l.trim().startsWith("## "));
  const sectionLines = nextHeadingIdx === -1 ? rest : rest.slice(0, nextHeadingIdx);
  return sectionLines
    .filter((l) => l.trim().startsWith("-"))
    .map((l) => l.replace(/^-/, "").trim())
    .filter((l) => l && !l.includes("PACKAGE_NAME") && !l.includes("TEAM_NAME"));
}

export function validatePrDescription(prBody, { root = ROOT } = {}) {
  const errors = [];

  const blastRadius = extractSection(prBody, "## Blast Radius");
  if (!blastRadius || blastRadius.length === 0) {
    errors.push('Missing or empty "## Blast Radius" section — every PR must declare which packages it touches.');
    return { ok: false, errors };
  }

  const knownPackages = new Set(listPackageDirs(root));
  const codeowners = parseCodeowners(
    readFileSync(join(root, ".github", "CODEOWNERS"), "utf-8")
  );

  const requiredTeams = new Set();
  for (const pkg of blastRadius) {
    const normalized = pkg.endsWith("/") ? pkg : `${pkg}/`;
    if (!knownPackages.has(normalized)) {
      errors.push(`Blast Radius lists "${pkg}", which is not a real package directory in this repo.`);
      continue;
    }
    const teams = codeowners.get(normalized) ?? [];
    teams.forEach((t) => requiredTeams.add(t));
  }

  const approvals = new Set(extractSection(prBody, "## Approvals") ?? []);
  for (const team of requiredTeams) {
    if (!approvals.has(team)) {
      errors.push(`Missing required approval from ${team} (owns a package listed in Blast Radius).`);
    }
  }

  return { ok: errors.length === 0, errors, blastRadius, requiredTeams: [...requiredTeams] };
}

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: node scripts/validate-pr-description.mjs <path-to-pr-body.md>");
    process.exit(2);
  }
  const prBody = readFileSync(filePath, "utf-8");
  const result = validatePrDescription(prBody);

  if (!result.ok) {
    console.error(`FAIL: ${filePath} does not satisfy Lesson 0's PR rules:`);
    for (const err of result.errors) console.error(`  - ${err}`);
    process.exit(1);
  }

  console.log(`OK: ${filePath} is correctly scoped.`);
  console.log(`  Blast Radius: ${result.blastRadius.join(", ")}`);
  console.log(`  Required approvals present: ${result.requiredTeams.join(", ") || "(none required — single-team package)"}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
