// The Control Tower's data must come from the same sources the terminal
// uses. These tests run the REAL `turbo run build --dry=json` and read the
// REAL CODEOWNERS, so a hand-maintained copy could never pass them.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { graphFromDryRun, summarizeRun, teamIndex, violationTarget } from "../apps/control-tower/server/collect.mjs";
import { parseCodeowners } from "../scripts/check-codeowners-coverage.mjs";
import { highlight, layout, levels, runCounts, statusFor, transitiveDependents } from "../apps/control-tower/src/lib/graph.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const codeowners = readFileSync(join(ROOT, ".github", "CODEOWNERS"), "utf-8");
const dry = JSON.parse(
  execFileSync(join(ROOT, "node_modules", ".bin", "turbo"), ["run", "build", "--dry=json"], { cwd: ROOT, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] })
);
const packages = graphFromDryRun(dry, codeowners);

describe("graph from turbo's real dry run", () => {
  it("has all 8 packages, the control tower included", () => {
    expect(packages.map((p) => p.name)).toEqual([
      "@pulse/admin", "@pulse/analytics", "@pulse/billing", "@pulse/config",
      "@pulse/contracts", "@pulse/control-tower", "@pulse/design-system", "@pulse/shell",
    ]);
  });

  it("gives every node exactly the owners CODEOWNERS lists for its folder", () => {
    const entries = parseCodeowners(codeowners);
    for (const pkg of packages) expect(pkg.owners).toEqual(entries.get(`${pkg.dir}/`));
  });

  it("places config at the bottom, design-system in the middle, apps on top", () => {
    const lv = levels(packages);
    expect(lv.get("@pulse/config")).toBe(0);
    expect(lv.get("@pulse/design-system")).toBe(1);
    expect(lv.get("@pulse/billing")).toBe(2);
    const { positions } = layout(packages);
    expect(positions.get("@pulse/billing").y).toBeLessThan(positions.get("@pulse/config").y);
  });

  it("changing contracts rebuilds 3 apps; the control tower depends on nothing", () => {
    expect(transitiveDependents(packages, "@pulse/contracts")).toEqual(["@pulse/admin", "@pulse/analytics", "@pulse/billing"]);
    expect(packages.find((p) => p.name === "@pulse/control-tower").dependencies).toEqual([]);
  });
});

describe("ownership", () => {
  const teams = teamIndex(packages);

  it("indexes the four CODEOWNERS teams with what each must approve", () => {
    expect(teams.map((t) => [t.team, t.packages.length])).toEqual([
      ["@pulse/admin-team", 4], ["@pulse/analytics-team", 4], ["@pulse/billing-team", 4], ["@pulse/platform-team", 5],
    ]);
  });

  it("clicking billing lights billing-team and the shared packages it co-owns", () => {
    const lit = highlight(packages, { selectedPackage: "@pulse/billing" });
    expect([...lit.teams]).toEqual(["@pulse/billing-team"]);
    expect([...lit.packages].sort()).toEqual(["@pulse/billing", "@pulse/config", "@pulse/contracts", "@pulse/design-system"]);
  });
});

describe("boundary violations become graph links", () => {
  it("resolves a package import to the package it names", () => {
    expect(violationTarget('import { renderInvoiceLine } from "@pulse/billing";', "apps/analytics/src", packages)).toBe("@pulse/billing");
  });
  it("resolves a relative escape to the folder it reaches into", () => {
    expect(violationTarget('import x from "../../billing/src/index.js";', "apps/analytics/src", packages)).toBe("@pulse/billing");
  });
  it("ignores third-party imports", () => {
    expect(violationTarget('import fs from "node:fs";', "apps/shell/src", packages)).toBeNull();
  });
});

describe("run summaries", () => {
  const summary = JSON.parse(readFileSync(join(ROOT, "fixtures", "turbo-runs", "remote-hit-run.json"), "utf-8"));

  it("reads a real remote-cache run: 8/8 hits, all from REMOTE", () => {
    const run = summarizeRun(summary);
    expect(run.tasks).toHaveLength(8);
    expect(runCounts(run)).toMatchObject({ cached: 8, "hit-remote": 8, miss: 0, total: 8 });
    expect(statusFor(run, "@pulse/control-tower")).toBe("hit-remote");
  });
});
