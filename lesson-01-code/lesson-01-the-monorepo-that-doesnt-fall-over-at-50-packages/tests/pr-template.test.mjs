// Carried forward from Lesson 0 unchanged.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { validatePrDescription, extractSection } from "../scripts/validate-pr-description.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FIXTURES = join(ROOT, "fixtures", "pr-bodies");

function loadFixture(name) {
  return readFileSync(join(FIXTURES, name), "utf-8");
}

describe("extractSection", () => {
  it("pulls bullet items out of a named markdown section", () => {
    const body = "## Blast Radius\n\n- apps/billing\n- packages/contracts\n\n## Approvals\n\n- @pulse/billing-team\n";
    expect(extractSection(body, "## Blast Radius")).toEqual(["apps/billing", "packages/contracts"]);
    expect(extractSection(body, "## Approvals")).toEqual(["@pulse/billing-team"]);
  });

  it("returns null when the heading is absent", () => {
    expect(extractSection("## Something Else\n- x", "## Blast Radius")).toBeNull();
  });
});

describe("validatePrDescription — Lesson 0's proof criteria", () => {
  it("PASSES a correctly single-team-scoped PR (proof: PR #1)", () => {
    const result = validatePrDescription(loadFixture("valid-scoped-pr.md"), { root: ROOT });
    expect(result.ok).toBe(true);
    expect(result.blastRadius).toEqual(["apps/billing"]);
  });

  it("PASSES a shared-package PR once every consuming team has approved (proof: PR #2)", () => {
    const result = validatePrDescription(
      loadFixture("shared-package-pr-needs-multi-approval.md"),
      { root: ROOT }
    );
    expect(result.ok).toBe(true);
    expect(result.requiredTeams.sort()).toEqual(
      ["@pulse/platform-team", "@pulse/billing-team", "@pulse/analytics-team", "@pulse/admin-team"].sort()
    );
  });

  it("BLOCKS a PR with no Blast Radius section at all", () => {
    const result = validatePrDescription(loadFixture("invalid-missing-blast-radius.md"), { root: ROOT });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/Blast Radius/);
  });

  it("BLOCKS a shared-package PR that hasn't collected every required team's approval (the core rule)", () => {
    const result = validatePrDescription(
      loadFixture("invalid-shared-package-missing-approvals.md"),
      { root: ROOT }
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("@pulse/billing-team"))).toBe(true);
    expect(result.errors.some((e) => e.includes("@pulse/analytics-team"))).toBe(true);
    expect(result.errors.some((e) => e.includes("@pulse/admin-team"))).toBe(true);
  });

  it("BLOCKS a PR that lists a package which doesn't exist in the repo", () => {
    const body = "## Blast Radius\n\n- apps/nonexistent\n\n## Approvals\n\n- @pulse/platform-team\n";
    const result = validatePrDescription(body, { root: ROOT });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/not a real package/);
  });
});
