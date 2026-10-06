// Billing data and pure helpers (Node-importable). The page lives in invoices/.
// Carried forward from Lessons 3-4: a tone per status, so badges pick a
// colour ROLE, not a colour.
import { formatDate, formatMoney } from "@pulse/utils";

/** @typedef {"paid" | "due" | "overdue"} InvoiceStatus */
/** @typedef {{ id: string, customer: string, issued: string, due: string, cents: number, status: InvoiceStatus }} Invoice */

/** @type {readonly Invoice[]} */
export const invoices = Object.freeze([
  { id: "INV-2041", customer: "Northwind Freight", issued: "2026-08-01", due: "2026-08-31", cents: 1284000, status: "paid" },
  { id: "INV-2042", customer: "Harbor & Pine Clinics", issued: "2026-08-03", due: "2026-09-02", cents: 452050, status: "paid" },
  { id: "INV-2043", customer: "Kestrel Analytics", issued: "2026-08-09", due: "2026-09-08", cents: 98900, status: "overdue" },
  { id: "INV-2044", customer: "Juniper School District", issued: "2026-08-15", due: "2026-09-14", cents: 2210000, status: "paid" },
  { id: "INV-2045", customer: "Blue Mesa Outfitters", issued: "2026-08-22", due: "2026-09-21", cents: 317500, status: "overdue" },
  { id: "INV-2046", customer: "Orchard Lane Bakery", issued: "2026-09-01", due: "2026-10-01", cents: 41200, status: "due" },
  { id: "INV-2047", customer: "Tidewater Logistics", issued: "2026-09-05", due: "2026-10-05", cents: 1675000, status: "due" },
  { id: "INV-2048", customer: "Copperline Studios", issued: "2026-09-12", due: "2026-10-12", cents: 264800, status: "due" },
]);

/** @type {Readonly<Record<InvoiceStatus, { label: string, tone: "success" | "warning" | "danger" }>>} */
export const STATUS = Object.freeze({
  paid: { label: "Paid", tone: "success" },
  due: { label: "Due soon", tone: "warning" },
  overdue: { label: "Overdue", tone: "danger" },
});

/** @typedef {"due" | "amount"} SortKey */

/**
 * @param {readonly Invoice[]} list @param {SortKey} key @param {"asc" | "desc"} dir
 * @returns {Invoice[]}
 */
export function sortInvoices(list, key, dir) {
  const sign = dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => sign * (key === "amount" ? a.cents - b.cents : a.due.localeCompare(b.due)));
}

/** @param {readonly Invoice[]} list */
export function totals(list) {
  /** @type {Record<InvoiceStatus, number>} */
  const out = { paid: 0, due: 0, overdue: 0 };
  for (const i of list) out[i.status] += i.cents;
  return out;
}

export { formatDate, formatMoney };
