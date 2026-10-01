// @pulse/analytics
import { parseInvoice } from "@pulse/contracts";
import { formatMoney } from "@pulse/design-system";

export function summarizeRevenue(rawInvoices) {
  const paid = rawInvoices.map(parseInvoice).filter((inv) => inv.status === "paid");
  const totalCents = paid.reduce((sum, inv) => sum + inv.amountCents, 0);
  return { paidCount: paid.length, total: formatMoney(totalCents) };
}
