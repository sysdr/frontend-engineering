// Lesson 3 — the runtime audit: measure rendered sizes, match them to roles.
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { auditTextSizes, matchRole, textElements } from "../packages/design-system/src/type-audit.js";

const page = (html) => new JSDOM(`<body>${html}</body>`).window.document.body;
// jsdom has no layout engine, so the test supplies what a browser would compute
const sizes = (map) => (el) => ({ fontSize: `${map[el.dataset.px] ?? 16}px` });

describe("the type audit", () => {
  it("matches a rendered size to its role", () => {
    expect(matchRole(12.8).role).toBe("caption");
    expect(matchRole(48.828125).role).toBe("display");
    expect(matchRole(15)).toBeNull();
  });

  it("collects only elements that directly hold text", () => {
    const body = page('<div><p>Due</p><span> </span><table><tr><td>INV-1</td></tr></table></div>');
    expect(textElements(body).map((e) => e.tagName)).toEqual(["P", "TD"]);
  });

  it("counts on-scale text by role and reports anything off the scale", () => {
    const body = page('<h1 data-px="h">Invoices</h1><p data-px="b">Open</p><p data-px="bad">Total</p>');
    const result = auditTextSizes(body, { getStyle: sizes({ h: 39.0625, b: 16, bad: 15 }) });
    expect(result.total).toBe(3);
    expect(result.onScale).toBe(2);
    expect(result.byRole.headline).toBe(1);
    expect(result.byRole.body).toBe(1);
    expect(result.offScale.map((o) => [o.text, o.px])).toEqual([["Total", 15]]);
  });
});
