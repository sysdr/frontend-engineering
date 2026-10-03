// Lesson 3 — what the Control Tower server now collects and serves.
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { collectTowerData, REPO_ROOT } from "../apps/control-tower/server/collect.mjs";
import { resolveStatic } from "../apps/control-tower/server/serve.mjs";

describe("the tower snapshot", () => {
  it("reads turbo's real graph, including the new control-tower -> design-system edge", async () => {
    const data = await collectTowerData();
    expect(data.packages).toHaveLength(8);
    const tower = data.packages.find((p) => p.name === "@pulse/control-tower");
    expect(tower.dependencies).toContain("@pulse/design-system");
    expect(tower.owners).toEqual(["@pulse/platform-team"]);
    expect(data.boundaryViolations).toEqual([]);
  });

  it("carries the type-scale lint result the panel draws", async () => {
    const { typeLint } = await collectTowerData();
    expect(typeLint.violations).toEqual([]);
    expect(typeLint.filesChecked).toBeGreaterThan(15);
  });
});

describe("the dev server's static mounts", () => {
  it("maps each URL to real source", () => {
    expect(resolveStatic(REPO_ROOT, "/")).toBe(join(REPO_ROOT, "apps/control-tower/src/index.html"));
    expect(resolveStatic(REPO_ROOT, "/billing/invoices/")).toBe(join(REPO_ROOT, "apps/billing/src/invoices/index.html"));
    expect(resolveStatic(REPO_ROOT, "/pkg/design-system/tokens/typography.css")).toBe(
      join(REPO_ROOT, "packages/design-system/src/tokens/typography.css")
    );
  });

  it("never serves anything outside a src/ folder", () => {
    expect(resolveStatic(REPO_ROOT, "/billing/../../../package.json")).toBeNull();
    expect(resolveStatic(REPO_ROOT, "/pkg/config/../package.json")).toBeNull();
  });
});
