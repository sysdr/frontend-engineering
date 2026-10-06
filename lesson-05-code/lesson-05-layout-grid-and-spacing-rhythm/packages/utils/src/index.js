// Carried forward from Lesson 1. Small shared helpers.

/** @param {number} cents @param {string} [currency] */
export function formatMoney(cents, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

/** @param {string} iso */
export function formatDate(iso) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(iso));
}
