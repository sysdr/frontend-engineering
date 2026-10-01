// @pulse/contracts — the shapes apps agree on. Apps never import each other;
// they meet here. (Zod-based schemas replace this hand check in Lesson 12.)
export const INVOICE_STATUSES = Object.freeze(["draft", "open", "paid", "void"]);

export function parseInvoice(raw) {
  if (typeof raw !== "object" || raw === null) throw new TypeError("invoice must be an object");
  const { id, amountCents, status } = raw;
  if (typeof id !== "string" || id.length === 0) throw new TypeError("invoice.id must be a non-empty string");
  if (!Number.isInteger(amountCents) || amountCents < 0) throw new TypeError("invoice.amountCents must be a non-negative integer");
  if (!INVOICE_STATUSES.includes(status)) throw new TypeError(`invoice.status must be one of ${INVOICE_STATUSES.join(", ")}`);
  return { id, amountCents, status };
}
