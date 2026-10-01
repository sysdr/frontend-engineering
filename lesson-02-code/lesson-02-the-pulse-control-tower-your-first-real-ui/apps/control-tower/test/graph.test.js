// Runs against the BUILT output (dist/), like every other package's tests,
// so `turbo run test` proves the shipped files work, not just src/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { highlight, isNewRun, levels, runCounts, statusFor, transitiveDependents } from "../dist/lib/graph.js";

const packages = [
  { name: "@pulse/config", owners: ["@pulse/platform-team", "@pulse/billing-team"], dependencies: [], dependents: ["@pulse/design-system"] },
  { name: "@pulse/design-system", owners: ["@pulse/platform-team", "@pulse/billing-team"], dependencies: ["@pulse/config"], dependents: ["@pulse/billing"] },
  { name: "@pulse/billing", owners: ["@pulse/billing-team"], dependencies: ["@pulse/design-system"], dependents: [] },
  { name: "@pulse/shell", owners: ["@pulse/platform-team"], dependencies: [], dependents: [] },
];

test("levels put dependencies below their dependents", () => {
  const lv = levels(packages);
  assert.equal(lv.get("@pulse/config"), 0);
  assert.equal(lv.get("@pulse/billing"), 2);
});

test("a config change ripples through design-system to billing", () => {
  assert.deepEqual(transitiveDependents(packages, "@pulse/config"), ["@pulse/billing", "@pulse/design-system"]);
});

test("selecting a package lights its CODEOWNERS teams and what they own", () => {
  const lit = highlight(packages, { selectedPackage: "@pulse/billing" });
  assert.deepEqual([...lit.teams], ["@pulse/billing-team"]);
  assert.deepEqual([...lit.packages].sort(), ["@pulse/billing", "@pulse/config", "@pulse/design-system"]);
});

test("selecting a team lights exactly the packages it owns", () => {
  const lit = highlight(packages, { selectedTeam: "@pulse/platform-team" });
  assert.deepEqual([...lit.packages].sort(), ["@pulse/config", "@pulse/design-system", "@pulse/shell"]);
});

test("run status and counts read turbo's cache fields", () => {
  const run = { id: "r2", tasks: [
    { package: "@pulse/billing", status: "MISS", source: null },
    { package: "@pulse/config", status: "HIT", source: "LOCAL" },
    { package: "@pulse/shell", status: "HIT", source: "REMOTE" },
  ] };
  assert.equal(statusFor(run, "@pulse/shell"), "hit-remote");
  assert.equal(statusFor(run, "@pulse/design-system"), "not-run");
  assert.deepEqual(runCounts(run), { "hit-local": 1, "hit-remote": 1, miss: 1, total: 3, cached: 2 });
  assert.equal(isNewRun({ id: "r1" }, run), true);
  assert.equal(isNewRun(run, run), false);
});
