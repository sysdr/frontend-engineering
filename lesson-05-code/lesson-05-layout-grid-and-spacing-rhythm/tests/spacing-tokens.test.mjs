// Lesson 5: the spacing scale, the layout roles, and the generated CSS.
import { describe, expect, it } from "vitest";
import {
  BASE_UNIT_PX,
  GRID_COLUMNS,
  SPACE_STEPS,
  classifyLength,
  layoutRoles,
  spaceScale,
  spacingCss,
  stepFor,
} from "../packages/design-system/src/tokens/spacing.js";
import { staleFiles } from "../scripts/generate-tokens.mjs";

describe("spacing scale", () => {
  it("uses an 8px base unit and names each step by its multiple", () => {
    expect(BASE_UNIT_PX).toBe(8);
    expect(spaceScale.map((s) => [s.name, s.px])).toEqual([
      ["space-1", 8],
      ["space-2", 16],
      ["space-3", 24],
      ["space-4", 32],
      ["space-6", 48],
      ["space-8", 64],
    ]);
  });

  it("has every step on the grid and in increasing order", () => {
    for (const s of spaceScale) expect(s.px % BASE_UNIT_PX).toBe(0);
    expect([...SPACE_STEPS].sort((a, b) => a - b)).toEqual([...SPACE_STEPS]);
  });

  it("points every layout role at a step that exists", () => {
    for (const def of Object.values(layoutRoles)) {
      expect(SPACE_STEPS).toContain(def.wide);
      expect(SPACE_STEPS).toContain(def.narrow);
    }
  });
});

describe("classifyLength", () => {
  it("knows a step, a whole multiple, and an off-grid value apart", () => {
    expect(classifyLength(24)).toBe("step");
    expect(classifyLength(40)).toBe("multiple");
    expect(classifyLength(16.6)).toBe("off-grid");
    expect(classifyLength(12.8)).toBe("off-grid");
    expect(classifyLength(3)).toBe("off-grid");
  });

  it("allows sub-pixel layout rounding but never a whole pixel", () => {
    expect(classifyLength(23.99)).toBe("step");
    expect(classifyLength(23)).toBe("off-grid");
    expect(classifyLength(25)).toBe("off-grid");
  });

  it("treats a negative margin by its size", () => {
    expect(classifyLength(-16)).toBe("step");
    expect(stepFor(-16)?.name).toBe("space-2");
  });
});

describe("generated spacing.css", () => {
  const css = spacingCss();

  it("declares every step and every layout role", () => {
    for (const s of spaceScale) expect(css).toContain(`--pulse-space-${s.multiple}: ${s.px}px;`);
    expect(css).toContain("--pulse-layout-gutter: var(--pulse-space-3);");
    expect(css).toContain("--pulse-layout-page-margin: var(--pulse-space-4);");
  });

  it("builds a 12-column grid with a span class per column", () => {
    expect(GRID_COLUMNS).toBe(12);
    expect(css).toContain("grid-template-columns: repeat(var(--pulse-grid-columns), minmax(0, 1fr));");
    for (let n = 1; n <= 12; n++) expect(css).toContain(`.pulse-span-${n} { grid-column: span ${n}; }`);
  });

  it("matches the committed file", async () => {
    expect(await staleFiles()).toEqual([]);
  });
});
