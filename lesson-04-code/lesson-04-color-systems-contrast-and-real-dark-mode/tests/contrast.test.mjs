import { describe, expect, it } from "vitest";
import { AA, contrastRatio, toComputedRgb, formatRatio, meetsAA, parseColor, relativeLuminance } from "../packages/design-system/src/tokens/contrast.js";

describe("WCAG contrast maths", () => {
  it("gives the textbook extremes", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 10);
    expect(contrastRatio("#ffffff", "#ffffff")).toBe(1);
    expect(relativeLuminance("#000")).toBe(0);
    expect(relativeLuminance("#fff")).toBe(1);
  });

  it("does not care which colour is on top", () => {
    expect(contrastRatio("#1f5fbf", "#ffffff")).toBe(contrastRatio("#ffffff", "#1f5fbf"));
  });

  it("puts the famous grey on each side of 4.5", () => {
    // #767676 is the lightest grey that passes AA on white; #777777 fails.
    expect(meetsAA(contrastRatio("#767676", "#ffffff"), "text")).toBe(true);
    expect(meetsAA(contrastRatio("#777777", "#ffffff"), "text")).toBe(false);
  });

  it("never rounds a failing ratio up to a pass on screen", () => {
    expect(formatRatio(4.4999)).toBe("4.49:1");
    expect(formatRatio(21)).toBe("21.00:1");
  });

  it("reads the rgb() strings getComputedStyle returns", () => {
    expect(parseColor("rgb(31, 95, 191)")).toEqual(parseColor("#1f5fbf"));
    expect(parseColor("rgba(255, 255, 255, 1)")).toEqual({ r: 255, g: 255, b: 255 });
    expect(() => parseColor("tomato")).toThrow(/Cannot parse/);
    expect(toComputedRgb("#1f5fbf")).toBe("rgb(31, 95, 191)");
  });

  it("uses the AA thresholds for text and for UI parts", () => {
    expect(AA).toEqual({ text: 4.5, "large-text": 3, ui: 3 });
  });
});
