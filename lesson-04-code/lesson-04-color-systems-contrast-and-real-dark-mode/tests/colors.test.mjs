import { describe, expect, it } from "vitest";
import { THEMES, palette, pairs, resolveRole, roles } from "../packages/design-system/src/tokens/colors.js";
import { auditContrast, summarize } from "../packages/design-system/src/contrast-audit.js";

describe("semantic colour roles", () => {
  it("gives every role a real palette entry in both themes", () => {
    for (const [role, def] of Object.entries(roles)) {
      for (const theme of THEMES) expect(palette[def[theme]], `${role}.${theme}`).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("only pairs roles that exist", () => {
    for (const p of pairs) {
      expect(roles[p.fg], p.fg).toBeDefined();
      expect(roles[p.bg], p.bg).toBeDefined();
    }
  });

  it("swaps values, not names: every role differs between themes except none", () => {
    const same = Object.keys(roles).filter((r) => resolveRole(r, "light") === resolveRole(r, "dark"));
    expect(same).toEqual([]);
  });
});

describe("the contrast audit", () => {
  it("checks 14 pairs in 2 themes, and all 28 pass AA as shipped", () => {
    const { total, passing, failing } = summarize(auditContrast());
    expect(total).toBe(28);
    expect(failing).toEqual([]);
    expect(passing).toBe(28);
  });

  it("catches the classic mistake: dark muted text reusing the light theme's grey", () => {
    const broken = (role, theme) =>
      role === "text-muted" && theme === "dark" ? palette["slate-600"] : resolveRole(role, theme);
    const { failing } = summarize(auditContrast({ resolve: broken }));
    expect(failing.map((f) => `${f.theme}:${f.fg}/${f.bg}`)).toEqual([
      "dark:text-muted/surface",
      "dark:text-muted/surface-raised",
      "dark:text-muted/surface-sunken",
    ]);
    for (const f of failing) expect(f.ratio).toBeLessThan(3);
  });
});
