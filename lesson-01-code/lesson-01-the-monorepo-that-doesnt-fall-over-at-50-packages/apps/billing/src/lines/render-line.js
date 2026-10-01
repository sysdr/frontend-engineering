// Nested on purpose: the build and the boundary rule must both see files
// below src/, not just src/index.js.
import { parseInvoice } from "@pulse/contracts";
import { formatMoney } from "@pulse/design-system";

export function renderInvoiceLine(raw) {
  const invoice = parseInvoice(raw);
  return `${invoice.id}  ${formatMoney(invoice.amountCents)}  ${invoice.status}`;
}
