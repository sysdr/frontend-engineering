import { test } from "node:test";
import assert from "node:assert/strict";
import { parseInvoice } from "../dist/index.js";

test("parseInvoice accepts a valid invoice and rejects a bad status", () => {
  assert.deepEqual(parseInvoice({ id: "inv_1", amountCents: 500, status: "paid" }), { id: "inv_1", amountCents: 500, status: "paid" });
  assert.throws(() => parseInvoice({ id: "inv_1", amountCents: 500, status: "lost" }), /status/);
});
