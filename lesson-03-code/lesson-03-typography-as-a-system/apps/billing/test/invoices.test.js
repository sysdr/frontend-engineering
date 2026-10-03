// Lesson 3 — the invoice list's model, tested against the BUILT package.
import { test } from "node:test";
import assert from "node:assert/strict";
import { AS_OF, INVOICES, buildInvoiceList, inView, sortRows, summarize, viewCounts } from "../dist/index.js";

const rows = buildInvoiceList(INVOICES, AS_OF);

test("every seed invoice passes the @pulse/contracts check", () => {
  assert.equal(rows.length, 18);
});

test("an open invoice past its due date is overdue, and still counts as open", () => {
  const counts = viewCounts(rows);
  assert.deepEqual(counts, { all: 18, open: 7, overdue: 3, paid: 7, draft: 2, void: 2 });
  assert.ok(rows.filter((r) => inView(r, "overdue")).every((r) => r.status === "open" && r.dueOn < AS_OF));
});

test("totals add up in cents", () => {
  const s = summarize(rows);
  assert.equal(s.outstandingCents, 8078995);
  assert.equal(s.overdueCents, 3169495);
  assert.equal(s.paidCents, 8058300);
});

test("sorting by amount and by due date works both ways", () => {
  const up = sortRows(rows, { key: "amountCents", direction: "ascending" });
  assert.equal(up[0].id, "INV-2027");
  assert.equal(up.at(-1).id, "INV-2026");
  const due = sortRows(rows, { key: "dueOn", direction: "descending" });
  assert.equal(due[0].id, "INV-2041");
});
