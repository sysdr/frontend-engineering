// The run inspector's data model and graph logic. The graph test runs the
// real `turbo run build --dry=json`, so it proves the inspector reads turbo's
// own view of the monorepo rather than a hand-kept copy.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { summarizeRun, graphFromDryRun } from "../scripts/build-report.mjs";
import { levels, layout, transitiveDependents, statusFor, runCounts } from "../report/src/graph.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const dry = JSON.parse(
  execFileSync(join(ROOT, "node_modules", ".bin", "turbo"), ["run", "build", "--dry=json"], { cwd: ROOT, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] })
);
const packages = graphFromDryRun(dry, readFileSync(join(ROOT, ".github", "CODEOWNERS"), "utf-8"));

describe("graph from turbo's real dry run", () => {
  it("has all 7 packages with owners from CODEOWNERS", () => {
    expect(packages.map((p) => p.name)).toHaveLength(7);
    expect(packages.find((p) => p.name === "@pulse/billing").owners).toEqual(["@pulse/billing-team"]);
  });

  it("places config at the bottom, design-system in the middle, apps on top", () => {
    const lv = levels(packages);
    expect(lv.get("@pulse/config")).toBe(0);
    expect(lv.get("@pulse/contracts")).toBe(0);
    expect(lv.get("@pulse/design-system")).toBe(1);
    expect(lv.get("@pulse/billing")).toBe(2);
    const { positions } = layout(packages);
    expect(positions.get("@pulse/billing").y).toBeLessThan(positions.get("@pulse/config").y);
  });

  it("changing contracts rebuilds 3 apps, and leaves shell and design-system cached", () => {
    expect(transitiveDependents(packages, "@pulse/contracts")).toEqual(["@pulse/admin", "@pulse/analytics", "@pulse/billing"]);
  });

  it("changing config ripples through design-system to every app", () => {
    expect(transitiveDependents(packages, "@pulse/config")).toEqual([
      "@pulse/admin", "@pulse/analytics", "@pulse/billing", "@pulse/design-system", "@pulse/shell",
    ]);
  });

  it("changing an app rebuilds only that app", () => {
    expect(transitiveDependents(packages, "@pulse/billing")).toEqual([]);
  });
});

describe("run summaries", () => {
  const summary = JSON.parse(readFileSync(join(ROOT, "fixtures", "turbo-runs", "remote-hit-run.json"), "utf-8"));

  it("reads a real remote-cache run: 7/7 hits, all from REMOTE", () => {
    const run = summarizeRun(summary);
    expect(run.tasks).toHaveLength(7);
    expect(runCounts(run)).toMatchObject({ cached: 7, "hit-remote": 7, miss: 0, total: 7 });
    expect(statusFor(run, "@pulse/billing")).toBe("hit-remote");
  });

  it("treats a package missing from a run as not-run, and a MISS as miss", () => {
    const run = { tasks: [{ package: "@pulse/billing", status: "MISS", source: null }] };
    expect(statusFor(run, "@pulse/billing")).toBe("miss");
    expect(statusFor(run, "@pulse/shell")).toBe("not-run");
  });
});
