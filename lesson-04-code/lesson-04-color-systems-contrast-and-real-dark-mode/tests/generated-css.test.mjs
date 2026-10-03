import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { colorsCss, roles, resolveRole } from "../packages/design-system/src/tokens/colors.js";
import { typographyCss } from "../packages/design-system/src/tokens/typography.js";

const dir = new URL("../packages/design-system/src/tokens/", import.meta.url);

describe("generated stylesheets", () => {
  it("colors.css is exactly what colors.js produces (run pnpm tokens if this fails)", () => {
    expect(readFileSync(new URL("colors.css", dir), "utf-8")).toBe(colorsCss());
  });

  it("typography.css is exactly what typography.js produces", () => {
    expect(readFileSync(new URL("typography.css", dir), "utf-8")).toBe(typographyCss());
  });

  it("defines every role in the light block, the dark block and the no-JS dark fallback", () => {
    const css = colorsCss();
    for (const role of Object.keys(roles)) {
      expect(css).toContain(`--pulse-color-${role}: ${resolveRole(role, "light")};`);
      expect(css.split(`--pulse-color-${role}: ${resolveRole(role, "dark")};`).length - 1).toBe(2);
    }
    expect(css).toContain('[data-theme="dark"]');
    expect(css).toContain('@media (prefers-color-scheme: dark)');
  });
});
