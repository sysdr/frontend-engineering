import { describe, expect, it } from "vitest";
import { STATUS_TONE, filterInvoices, invoices, sortInvoices, totals } from "../apps/billing/src/index.js";
import { roles } from "../packages/design-system/src/tokens/colors.js";

describe("billing invoices", () => {
  it("has 18 invoices and filters by status", () => {
    expect(invoices).toHaveLength(18);
    expect(filterInvoices(invoices, "overdue").map((i) => i.id)).toEqual(["INV-2020", "INV-2023", "INV-2025", "INV-2028"]);
  });

  it("sorts by amount both ways", () => {
    expect(sortInvoices([...invoices], "amountCents", "desc")[0].id).toBe("INV-2035");
    expect(sortInvoices([...invoices], "amountCents", "asc")[0].id).toBe("INV-2026");
  });

  it("maps every status to a tone that has real colour roles behind it", () => {
    for (const tone of Object.values(STATUS_TONE)) {
      expect(roles[`${tone}-text`]).toBeDefined();
      expect(roles[`${tone}-surface`]).toBeDefined();
    }
  });

  it("adds up the totals", () => {
    const t = totals(invoices);
    expect(t.overdue).toBe(2199900);
    expect(t.paid + t.open + t.overdue).toBe(invoices.reduce((s, i) => s + i.amountCents, 0));
  });
});
