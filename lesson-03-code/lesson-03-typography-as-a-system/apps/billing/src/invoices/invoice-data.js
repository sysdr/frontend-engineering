// Seed invoices for the Lesson 3 invoice list. Every record goes through
// @pulse/contracts' parseInvoice before the page renders it, exactly as an
// API response would. (A real billing service arrives in Lesson 22.)
export const AS_OF = "2026-10-01"; // "today" for overdue math, fixed so screenshots are stable

export const INVOICES = Object.freeze([
  { id: "INV-2041", customer: "Northwind Logistics", issuedOn: "2026-09-29", dueOn: "2026-10-29", amountCents: 1284000, status: "open" },
  { id: "INV-2040", customer: "Halcyon Health Partners", issuedOn: "2026-09-28", dueOn: "2026-10-28", amountCents: 462550, status: "draft" },
  { id: "INV-2039", customer: "Bluefin Analytics", issuedOn: "2026-09-25", dueOn: "2026-10-09", amountCents: 98000, status: "open" },
  { id: "INV-2038", customer: "Okafor & Lindqvist LLP", issuedOn: "2026-09-22", dueOn: "2026-10-22", amountCents: 2150000, status: "paid" },
  { id: "INV-2037", customer: "Meridian Freight Co.", issuedOn: "2026-09-18", dueOn: "2026-09-25", amountCents: 735420, status: "open" },
  { id: "INV-2036", customer: "Tamarind Studio", issuedOn: "2026-09-16", dueOn: "2026-10-16", amountCents: 41900, status: "paid" },
  { id: "INV-2035", customer: "Cobalt Ridge Mining", issuedOn: "2026-09-12", dueOn: "2026-09-26", amountCents: 1930075, status: "open" },
  { id: "INV-2034", customer: "Saffron Lane Hotels", issuedOn: "2026-09-10", dueOn: "2026-10-10", amountCents: 316000, status: "paid" },
  { id: "INV-2033", customer: "Pinecrest School District", issuedOn: "2026-09-08", dueOn: "2026-10-08", amountCents: 880000, status: "void" },
  { id: "INV-2032", customer: "Quillfeather Publishing", issuedOn: "2026-09-04", dueOn: "2026-10-04", amountCents: 127500, status: "open" },
  { id: "INV-2031", customer: "Arden Robotics", issuedOn: "2026-09-02", dueOn: "2026-09-16", amountCents: 504000, status: "open" },
  { id: "INV-2030", customer: "Verity Insurance Group", issuedOn: "2026-08-30", dueOn: "2026-09-29", amountCents: 2675000, status: "paid" },
  { id: "INV-2029", customer: "Lumen Dental Clinics", issuedOn: "2026-08-27", dueOn: "2026-09-26", amountCents: 228900, status: "paid" },
  { id: "INV-2028", customer: "Kestrel Aviation Services", issuedOn: "2026-08-25", dueOn: "2026-09-24", amountCents: 1102500, status: "paid" },
  { id: "INV-2027", customer: "Driftwood Coffee Roasters", issuedOn: "2026-08-21", dueOn: "2026-09-20", amountCents: 18650, status: "void" },
  { id: "INV-2026", customer: "Granite Peak Credit Union", issuedOn: "2026-08-19", dueOn: "2026-10-18", amountCents: 3400000, status: "open" },
  { id: "INV-2025", customer: "Harbor & Vine Events", issuedOn: "2026-08-15", dueOn: "2026-09-14", amountCents: 67300, status: "draft" },
  { id: "INV-2024", customer: "Solstice Energy Cooperative", issuedOn: "2026-08-12", dueOn: "2026-09-11", amountCents: 1544000, status: "paid" },
]);
