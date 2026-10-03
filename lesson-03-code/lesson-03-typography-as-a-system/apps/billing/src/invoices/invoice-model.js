// Everything the invoice list knows, as plain functions with no DOM, so
// node --test can check them and the page only has to draw the result.
import { parseInvoice } from "@pulse/contracts";

// The contract checks id, amount and status; the list also needs who and when.
export function toRow(raw, asOf) {
  const invoice = parseInvoice(raw);
  const overdue = invoice.status === "open" && raw.dueOn < asOf;
  return { ...invoice, customer: raw.customer, issuedOn: raw.issuedOn, dueOn: raw.dueOn, view: overdue ? "overdue" : invoice.status };
}

export const VIEWS = Object.freeze([
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "overdue", label: "Overdue" },
  { id: "paid", label: "Paid" },
  { id: "draft", label: "Draft" },
  { id: "void", label: "Void" },
]);

// "Open" includes overdue invoices: overdue is a kind of open, not a rival.
export function inView(row, view) {
  if (view === "all") return true;
  if (view === "open") return row.status === "open";
  return row.view === view;
}

export function viewCounts(rows) {
  return Object.fromEntries(VIEWS.map((v) => [v.id, rows.filter((r) => inView(r, v.id)).length]));
}

const COMPARE = {
  dueOn: (a, b) => a.dueOn.localeCompare(b.dueOn),
  amountCents: (a, b) => a.amountCents - b.amountCents,
  id: (a, b) => a.id.localeCompare(b.id),
};

export function sortRows(rows, { key = "id", direction = "descending" } = {}) {
  const sign = direction === "ascending" ? 1 : -1;
  return [...rows].sort((a, b) => sign * COMPARE[key](a, b) || b.id.localeCompare(a.id));
}

export function summarize(rows) {
  const sum = (list) => list.reduce((total, r) => total + r.amountCents, 0);
  const open = rows.filter((r) => r.status === "open");
  const overdue = rows.filter((r) => r.view === "overdue");
  return {
    outstandingCents: sum(open),
    overdueCents: sum(overdue),
    overdueCount: overdue.length,
    paidCents: sum(rows.filter((r) => r.status === "paid")),
    openCount: open.length,
  };
}

export function buildInvoiceList(raws, asOf) {
  return raws.map((raw) => toRow(raw, asOf));
}
