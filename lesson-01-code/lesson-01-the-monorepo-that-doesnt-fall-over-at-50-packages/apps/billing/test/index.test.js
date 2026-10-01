import { test } from "node:test";
import assert from "node:assert/strict";
import { renderInvoiceLine } from "../dist/index.js";

test("renders one invoice line through contracts + design-system", () => {
  assert.equal(renderInvoiceLine({ id: "inv_7", amountCents: 4200, status: "open" }), "inv_7  $42.00  open");
});
