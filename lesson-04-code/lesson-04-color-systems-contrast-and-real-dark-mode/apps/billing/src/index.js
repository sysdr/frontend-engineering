// Billing data and pure helpers (Node-importable). The page lives in invoices/.
// Carried forward from Lesson 3; Lesson 4 adds a tone per status so badges
// pick a colour ROLE, not a colour.

/** @typedef {"paid" | "open" | "overdue"} InvoiceStatus */
/** @typedef {{ id: string, customer: string, issued: string, due: string, amountCents: number, status: InvoiceStatus }} Invoice */

/** @type {readonly Invoice[]} */
export const invoices = Object.freeze([
  { id: "INV-2018", customer: "Northwind Freight", issued: "2026-07-02", due: "2026-08-01", amountCents: 1284000, status: "paid" },
  { id: "INV-2019", customer: "Halcyon Health", issued: "2026-07-05", due: "2026-08-04", amountCents: 452500, status: "paid" },
  { id: "INV-2020", customer: "Bramble & Co", issued: "2026-07-09", due: "2026-08-08", amountCents: 98000, status: "overdue" },
  { id: "INV-2021", customer: "Quayside Labs", issued: "2026-07-11", due: "2026-08-10", amountCents: 2210000, status: "paid" },
  { id: "INV-2022", customer: "Ostrava Metals", issued: "2026-07-15", due: "2026-08-14", amountCents: 763050, status: "paid" },
  { id: "INV-2023", customer: "Lumen Schools", issued: "2026-07-20", due: "2026-08-19", amountCents: 129900, status: "overdue" },
  { id: "INV-2024", customer: "Pico Robotics", issued: "2026-07-24", due: "2026-08-23", amountCents: 3399000, status: "paid" },
  { id: "INV-2025", customer: "Tern Air", issued: "2026-08-01", due: "2026-08-31", amountCents: 512000, status: "overdue" },
  { id: "INV-2026", customer: "Vale Ceramics", issued: "2026-08-04", due: "2026-09-03", amountCents: 64500, status: "paid" },
  { id: "INV-2027", customer: "Juniper Legal", issued: "2026-08-12", due: "2026-09-11", amountCents: 875000, status: "paid" },
  { id: "INV-2028", customer: "Kestrel Media", issued: "2026-08-18", due: "2026-09-17", amountCents: 1460000, status: "overdue" },
  { id: "INV-2029", customer: "Northwind Freight", issued: "2026-08-25", due: "2026-09-24", amountCents: 1284000, status: "paid" },
  { id: "INV-2030", customer: "Marlowe Foods", issued: "2026-09-01", due: "2026-10-01", amountCents: 238075, status: "open" },
  { id: "INV-2031", customer: "Halcyon Health", issued: "2026-09-05", due: "2026-10-05", amountCents: 452500, status: "open" },
  { id: "INV-2032", customer: "Quayside Labs", issued: "2026-09-10", due: "2026-10-10", amountCents: 2210000, status: "open" },
  { id: "INV-2033", customer: "Ferro Bikes", issued: "2026-09-14", due: "2026-10-14", amountCents: 187500, status: "open" },
  { id: "INV-2034", customer: "Lumen Schools", issued: "2026-09-21", due: "2026-10-21", amountCents: 129900, status: "open" },
  { id: "INV-2035", customer: "Pico Robotics", issued: "2026-09-28", due: "2026-10-28", amountCents: 4125000, status: "open" },
]);

/** Status to colour role family. The badge CSS turns a tone into roles. */
export const STATUS_TONE = Object.freeze({ paid: "success", open: "warning", overdue: "danger" });
export const STATUS_LABEL = Object.freeze({ paid: "Paid", open: "Open", overdue: "Overdue" });

/** @param {readonly Invoice[]} list @param {InvoiceStatus | "all"} status */
export function filterInvoices(list, status) {
  return status === "all" ? [...list] : list.filter((i) => i.status === status);
}

/** @param {Invoice[]} list @param {"id" | "customer" | "due" | "amountCents"} key @param {"asc" | "desc"} dir */
export function sortInvoices(list, key, dir) {
  const sign = dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => (a[key] < b[key] ? -sign : a[key] > b[key] ? sign : 0));
}

/** @param {readonly Invoice[]} list */
export function totals(list) {
  const sum = (/** @type {InvoiceStatus} */ s) => list.filter((i) => i.status === s).reduce((t, i) => t + i.amountCents, 0);
  return { paid: sum("paid"), open: sum("open"), overdue: sum("overdue") };
}
