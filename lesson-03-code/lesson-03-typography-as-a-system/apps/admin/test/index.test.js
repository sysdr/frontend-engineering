import { test } from "node:test";
import assert from "node:assert/strict";
import { statusLegend } from "../dist/index.js";

test("every contract status has a design-system tone", () => {
  assert.ok(statusLegend().every((row) => typeof row.tone === "string"));
});
