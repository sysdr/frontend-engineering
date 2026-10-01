// Carried forward from Lesson 1. Lesson 2 change: readBoundaries now lives in
// the Control Tower's collector (it replaced scripts/build-report.mjs).
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { RuleTester } from "eslint";
import { noCrossBoundaryImport } from "../packages/config/eslint/no-cross-boundary-import.js";
import { readBoundaries } from "../apps/control-tower/server/collect.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = (rel) => join(ROOT, rel);

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({ languageOptions: { ecmaVersion: "latest", sourceType: "module" } });

tester.run("pulse/no-cross-boundary-import", noCrossBoundaryImport, {
  valid: [
    { name: "app -> declared shared package", filename: file("apps/billing/src/index.js"), code: 'import { parseInvoice } from "@pulse/contracts";' },
    { name: "nested file -> declared shared package", filename: file("apps/billing/src/lines/render-line.js"), code: 'import { formatMoney } from "@pulse/design-system";' },
    { name: "relative import inside own package", filename: file("apps/billing/src/index.js"), code: 'export { renderInvoiceLine } from "./lines/render-line.js";' },
    { name: "shared -> declared shared", filename: file("packages/design-system/src/index.js"), code: 'import { platformConfig } from "@pulse/config";' },
    { name: "third-party import is not our business", filename: file("apps/shell/src/index.js"), code: 'import fs from "node:fs";' },
    { name: "control tower: relative import inside its own src", filename: file("apps/control-tower/src/main.js"), code: 'import { el } from "./lib/dom.js";' },
  ],
  invalid: [
    { name: "app -> app", filename: file("apps/analytics/src/index.js"), code: 'import { renderInvoiceLine } from "@pulse/billing";', errors: [{ messageId: "appToApp" }] },
    { name: "app -> app via re-export", filename: file("apps/admin/src/index.js"), code: 'export * from "@pulse/analytics";', errors: [{ messageId: "appToApp" }] },
    { name: "app -> app via dynamic import", filename: file("apps/shell/src/index.js"), code: 'const m = await import("@pulse/billing");', errors: [{ messageId: "appToApp" }] },
    { name: "shared -> app", filename: file("packages/contracts/src/index.js"), code: 'import { summarizeRevenue } from "@pulse/analytics";', errors: [{ messageId: "sharedToApp" }] },
    { name: "undeclared shared dependency", filename: file("apps/shell/src/index.js"), code: 'import { parseInvoice } from "@pulse/contracts";', errors: [{ messageId: "undeclared" }] },
    { name: "relative path escaping the package", filename: file("apps/analytics/src/index.js"), code: 'import { renderInvoiceLine } from "../../billing/src/index.js";', errors: [{ messageId: "relativeEscape" }] },
    { name: "control tower may not import an app it displays", filename: file("apps/control-tower/src/main.js"), code: 'import { navigation } from "@pulse/shell";', errors: [{ messageId: "appToApp" }] },
  ],
});

describe("the real repo", () => {
  it("has zero boundary violations in apps/*/src and packages/*/src", async () => {
    expect(await readBoundaries(ROOT)).toEqual([]);
  });
});
