import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import {
  listPackageDirs,
  parseCodeowners,
  findUncoveredPackages,
} from "../scripts/check-codeowners-coverage.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

describe("CODEOWNERS coverage", () => {
  it("lists every real apps/* and packages/* directory in this repo", () => {
    const dirs = listPackageDirs();
    expect(dirs).toContain("apps/shell/");
    expect(dirs).toContain("apps/billing/");
    expect(dirs).toContain("apps/analytics/");
    expect(dirs).toContain("apps/admin/");
    expect(dirs).toContain("packages/design-system/");
    expect(dirs).toContain("packages/contracts/");
    expect(dirs).toContain("packages/config/");
    expect(dirs).toHaveLength(7);
  });

  it("parses CODEOWNERS entries into path -> teams", () => {
    const sample = [
      "# a comment, ignored",
      "apps/shell/  @pulse/platform-team",
      "packages/design-system/  @pulse/platform-team @pulse/billing-team",
      "",
    ].join("\n");
    const parsed = parseCodeowners(sample);
    expect(parsed.get("apps/shell/")).toEqual(["@pulse/platform-team"]);
    expect(parsed.get("packages/design-system/")).toEqual([
      "@pulse/platform-team",
      "@pulse/billing-team",
    ]);
  });

  it("flags a package directory that has no CODEOWNERS entry", () => {
    const dirs = ["apps/shell/", "apps/billing/"];
    const entries = parseCodeowners("apps/shell/  @pulse/platform-team");
    const uncovered = findUncoveredPackages(dirs, entries);
    expect(uncovered).toEqual(["apps/billing/"]);
  });

  it("the repo's actual CODEOWNERS file covers every real package (no drift)", () => {
    // This is the exact check scripts/check-codeowners-coverage.mjs runs in CI,
    // run here against the real repo state instead of a synthetic sample.
    const codeownersText = readFileSync(join(ROOT, ".github", "CODEOWNERS"), "utf-8");
    const entries = parseCodeowners(codeownersText);
    const dirs = listPackageDirs(ROOT);
    const uncovered = findUncoveredPackages(dirs, entries);
    expect(uncovered).toEqual([]);
  });

  it("every shared package requires all four teams' approval", () => {
    const codeownersText = readFileSync(join(ROOT, ".github", "CODEOWNERS"), "utf-8");
    const entries = parseCodeowners(codeownersText);
    for (const shared of ["packages/design-system/", "packages/contracts/", "packages/config/"]) {
      expect(entries.get(shared)).toHaveLength(4);
    }
  });
});
