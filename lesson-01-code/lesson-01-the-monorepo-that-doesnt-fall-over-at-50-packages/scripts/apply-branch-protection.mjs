#!/usr/bin/env node
// Carried forward from Lesson 0 unchanged.
// Applies .github/branch-protection.json to a real GitHub repo via the API.
//   default (dry run) — validates the policy JSON and prints what WOULD be sent.
//   --apply — requires GITHUB_TOKEN and GITHUB_REPO env vars, makes the real PUT.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

export function loadPolicy(root = ROOT) {
  const raw = readFileSync(join(root, ".github", "branch-protection.json"), "utf-8");
  const policy = JSON.parse(raw);
  const required = ["branch", "required_status_checks", "required_pull_request_reviews"];
  const missing = required.filter((k) => !(k in policy));
  if (missing.length > 0) {
    throw new Error(`branch-protection.json is missing required keys: ${missing.join(", ")}`);
  }
  return policy;
}

async function apply(policy) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // e.g. "your-org/pulse-platform"
  if (!token || !repo) {
    console.error("FAIL: --apply requires GITHUB_TOKEN and GITHUB_REPO environment variables.");
    process.exit(1);
  }
  const url = `https://api.github.com/repos/${repo}/branches/${policy.branch}/protection`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(policy),
  });
  if (!res.ok) {
    console.error(`FAIL: GitHub API responded ${res.status} ${res.statusText}`);
    console.error(await res.text());
    process.exit(1);
  }
  console.log(`OK: branch protection applied to ${repo}#${policy.branch}`);
}

function main() {
  const policy = loadPolicy();
  const apply_ = process.argv.includes("--apply");

  if (!apply_) {
    console.log("DRY RUN (default) — policy is valid. Would PUT this to GitHub:");
    console.log(JSON.stringify(policy, null, 2));
    console.log("\nRun with --apply (and GITHUB_TOKEN / GITHUB_REPO set) to apply for real.");
    return;
  }
  apply(policy);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
