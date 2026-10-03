// @pulse/design-system — tokens and formatters shared by every app.
// Lesson 3: the type scale (tokens/typography.js) and its runtime audit.
import { platformConfig } from "@pulse/config";

export * from "./tokens/typography.js";
export { auditTextSizes, matchRole, textElements } from "./type-audit.js";

export const tokens = Object.freeze({
  status: { draft: "neutral", open: "info", paid: "success", void: "danger" },
});

export function formatMoney(cents) {
  return new Intl.NumberFormat(platformConfig.locale, {
    style: "currency",
    currency: platformConfig.currency,
  }).format(cents / 100);
}
