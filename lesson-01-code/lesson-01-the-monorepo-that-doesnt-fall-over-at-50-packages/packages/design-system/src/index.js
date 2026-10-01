// @pulse/design-system — tokens and formatters shared by every app.
// (Lesson 3 replaces these placeholder tokens with a real type scale.)
import { platformConfig } from "@pulse/config";

export const tokens = Object.freeze({
  status: { draft: "neutral", open: "info", paid: "success", void: "danger" },
});

export function formatMoney(cents) {
  return new Intl.NumberFormat(platformConfig.locale, {
    style: "currency",
    currency: platformConfig.currency,
  }).format(cents / 100);
}
