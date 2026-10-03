import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeRevenue } from "../dist/index.js";

test("sums only paid invoices", () => {
  const out = summarizeRevenue([
    { id: "a", amountCents: 1000, status: "paid" },
    { id: "b", amountCents: 9999, status: "open" },
    { id: "c", amountCents: 250, status: "paid" },
  ]);
  assert.deepEqual(out, { paidCount: 2, total: "$12.50" });
});
