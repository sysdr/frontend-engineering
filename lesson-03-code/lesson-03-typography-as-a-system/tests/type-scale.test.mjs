// Lesson 3 — the type scale is a ratio, not a list of numbers someone liked.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  BASE_PX,
  BASELINE_PX,
  MIN_LEGIBLE_PX,
  TEXT_ROLES,
  TYPE_RATIO,
  buildScale,
  lineHeightFor,
  modularScale,
  typeScale,
  typographyCss,
} from "../packages/design-system/src/tokens/typography.js";

describe("the modular type scale", () => {
  it("is 1.25 from a 16px base, with body text at step 0", () => {
    expect(TYPE_RATIO).toBe(1.25);
    expect(BASE_PX).toBe(16);
    expect(typeScale.find((s) => s.role === "body").sizePx).toBe(16);
  });

  it("has seven roles on seven consecutive steps", () => {
    expect(typeScale.map((s) => s.role)).toEqual(["caption", "body", "subheading", "heading", "title", "headline", "display"]);
    typeScale.forEach((s, i) => i > 0 && expect(s.step).toBe(typeScale[i - 1].step + 1));
  });

  it("makes every step exactly the ratio times the one below it", () => {
    for (let i = 1; i < typeScale.length; i += 1) {
      expect(typeScale[i].sizePx / typeScale[i - 1].sizePx).toBeCloseTo(TYPE_RATIO, 10);
    }
  });

  it("produces the documented sizes", () => {
    expect(typeScale.map((s) => +s.sizePx.toFixed(2))).toEqual([12.8, 16, 20, 25, 31.25, 39.06, 48.83]);
  });

  it("never puts a role under the 12px legibility floor", () => {
    expect(Math.min(...typeScale.map((s) => s.sizePx))).toBeGreaterThanOrEqual(MIN_LEGIBLE_PX);
    // step -2 exists on the ratio, which is exactly why it is not a role
    expect(modularScale(-2)).toBeLessThan(MIN_LEGIBLE_PX);
  });

  it("lands every line-height on the 4px baseline, with room above the text", () => {
    for (const s of typeScale) {
      expect(s.lineHeightPx % BASELINE_PX).toBe(0);
      expect(s.lineHeightPx).toBeGreaterThanOrEqual(s.sizePx * 1.2);
    }
    expect(typeScale.map((s) => s.lineHeightPx)).toEqual([20, 24, 28, 36, 44, 52, 64]);
    expect(lineHeightFor(16)).toBe(24);
  });

  it("builds any ratio on request without changing what ships", () => {
    const fifth = buildScale({ ratio: 1.5 });
    expect(fifth.at(-1).sizePx).toBeCloseTo(121.5, 5);
    expect(typeScale.at(-1).sizePx).toBeCloseTo(48.828125, 6);
    expect(TEXT_ROLES).toHaveLength(fifth.length);
  });
});

describe("the generated CSS", () => {
  const committed = readFileSync(new URL("../packages/design-system/src/tokens/typography.css", import.meta.url), "utf-8");

  it("is exactly what typography.js generates (no hand edits)", () => {
    expect(committed).toBe(typographyCss());
  });

  it("declares a size, line-height and weight variable and a class for every role", () => {
    for (const s of typeScale) {
      expect(committed).toContain(`--pulse-font-size-${s.role}: ${+s.sizeRem.toFixed(6)}rem;`);
      expect(committed).toContain(`--pulse-line-height-${s.role}:`);
      expect(committed).toContain(`--pulse-font-weight-${s.role}: ${s.weight};`);
      expect(committed).toContain(`.pulse-text-${s.role} {`);
    }
  });
});
