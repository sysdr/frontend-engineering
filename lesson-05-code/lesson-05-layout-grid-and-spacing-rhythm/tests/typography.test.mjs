// Carried forward from Lesson 3: the type scale. Its 4px line-height rhythm
// halves the 8px spacing unit, so text and space stay in step.
import { describe, expect, it } from "vitest";
import { BASELINE_PX, typeScale } from "../packages/design-system/src/tokens/typography.js";
import { BASE_UNIT_PX } from "../packages/design-system/src/tokens/spacing.js";

describe("type scale", () => {
  it("has seven roles from 12.8px to 48.83px", () => {
    expect(typeScale.map((s) => +s.sizePx.toFixed(2))).toEqual([12.8, 16, 20, 25, 31.25, 39.06, 48.83]);
  });
  it("puts every line height on the 4px baseline, half the spacing unit", () => {
    expect(BASE_UNIT_PX % BASELINE_PX).toBe(0);
    for (const s of typeScale) expect(s.lineHeightPx % BASELINE_PX).toBe(0);
  });
});
