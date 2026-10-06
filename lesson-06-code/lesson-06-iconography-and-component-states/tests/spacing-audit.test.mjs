// Lesson 5: the gap maths the overlay runs on real boxes, checked on fixed ones.
import { describe, expect, it } from "vitest";
import { neighbourGaps, summarizeSpacing } from "../packages/design-system/src/spacing-audit.js";

/** @param {number} left @param {number} top @param {number} width @param {number} height */
const box = (left, top, width, height) => ({ left, top, right: left + width, bottom: top + height });

describe("neighbourGaps", () => {
  it("measures the gap between items in a row", () => {
    const gaps = neighbourGaps([box(0, 0, 100, 40), box(124, 0, 100, 40), box(248, 0, 50, 40)], "row");
    expect(gaps.map((g) => [g.axis, g.px])).toEqual([
      ["x", 24],
      ["x", 24],
    ]);
  });

  it("measures a wrapped row's line gap from the tallest item, not a short centred one", () => {
    // Line 1: a 40px button and a 20px badge centred beside it. Line 2 starts 16px below the button.
    const gaps = neighbourGaps([box(0, 0, 100, 40), box(108, 10, 60, 20), box(0, 56, 80, 40)], "row");
    expect(gaps).toContainEqual(expect.objectContaining({ axis: "y", px: 16 }));
    expect(gaps).toContainEqual(expect.objectContaining({ axis: "x", px: 8 }));
    expect(gaps.some((g) => g.px === 26)).toBe(false);
  });

  it("measures a column item by item", () => {
    const gaps = neighbourGaps([box(0, 0, 200, 28), box(0, 44, 200, 20), box(0, 80, 200, 100)], "column");
    expect(gaps.map((g) => g.px)).toEqual([16, 16]);
  });

  it("reads a grid as rows of tracks", () => {
    const cells = [box(0, 0, 90, 50), box(114, 0, 90, 50), box(0, 74, 90, 50), box(114, 74, 90, 50)];
    const gaps = neighbourGaps(cells, "row");
    expect(gaps.filter((g) => g.axis === "x").map((g) => g.px)).toEqual([24, 24]);
    expect(gaps.filter((g) => g.axis === "y").map((g) => g.px)).toEqual([24]);
  });

  it("ignores touching items", () => {
    expect(neighbourGaps([box(0, 0, 50, 20), box(50, 0, 50, 20)], "row")).toEqual([]);
  });
});

describe("summarizeSpacing", () => {
  const b = box(0, 0, 1, 1);
  it("counts on- and off-grid spaces and leaves free gaps out", () => {
    const s = summarizeSpacing([
      { kind: "padding", side: "top", px: 24, status: "step", box: b, where: "section.panel" },
      { kind: "margin", side: "left", px: 40, status: "multiple", box: b, where: "dd" },
      { kind: "margin", side: "top", px: 16.6, status: "off-grid", box: b, where: "h2" },
      { kind: "gap", side: "column", px: 873, status: "free", box: b, where: "header.topbar" },
    ]);
    expect(s).toMatchObject({ total: 3, onGrid: 2, free: 1, byKind: { padding: 1, margin: 2, gap: 0 } });
    expect(s.offGrid.map((m) => m.where)).toEqual(["h2"]);
  });
});
