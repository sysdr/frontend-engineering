// @pulse/admin
import { INVOICE_STATUSES } from "@pulse/contracts";
import { tokens } from "@pulse/design-system";

export function statusLegend() {
  return INVOICE_STATUSES.map((status) => ({ status, tone: tokens.status[status] }));
}
