// Carried forward from Lesson 4: the contrast maths and the gate.
import { describe, expect, it } from "vitest";
import { contrastRatio, formatRatio } from "../packages/design-system/src/tokens/contrast.js";
import { auditContrast, summarize } from "../packages/design-system/src/contrast-audit.js";
import { resolveRole } from "../packages/design-system/src/tokens/colors.js";

describe("contrast", () => {
  it("puts the two greys either side of 4.5:1, truncating rather than rounding", () => {
    expect(formatRatio(contrastRatio("#767676", "#ffffff"))).toBe("4.54:1");
    expect(formatRatio(contrastRatio("#777777", "#ffffff"))).toBe("4.47:1");
  });
  it("passes all 28 checks with the shipped tokens", () => {
    const s = summarize(auditContrast());
    expect([s.total, s.passing]).toEqual([28, 28]);
  });
  it("fails dark muted text that reuses the light grey", () => {
    const resolve = (/** @type {string} */ role, /** @type {"light" | "dark"} */ theme) =>
      role === "text-muted" && theme === "dark" ? "#4b576a" : resolveRole(role, theme);
    expect(summarize(auditContrast({ resolve })).failing).toHaveLength(3);
  });
});
