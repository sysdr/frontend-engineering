// The design-system lint rules: Lesson 5's no-raw-spacing, plus the
// carried-forward no-raw-color (Lesson 4) and no-raw-font-size (Lesson 3).
import css from "@eslint/css";
import { RuleTester } from "eslint";
import { afterAll, describe, expect, it } from "vitest";
import noRawColor from "../packages/config/eslint/no-raw-color.js";
import noRawFontSize from "../packages/config/eslint/no-raw-font-size.js";
import noRawSpacing, { isAllowedSpacing } from "../packages/config/eslint/no-raw-spacing.js";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.afterAll = afterAll;

const cssTester = new RuleTester({ plugins: { css }, language: "css/css" });
const jsTester = new RuleTester({ languageOptions: { ecmaVersion: "latest", sourceType: "module" } });

describe("isAllowedSpacing", () => {
  it("accepts tokens, layout roles, 0, auto and token-only calc()", () => {
    for (const v of ["0", "auto", "var(--pulse-space-2)", "0 var(--pulse-space-1)", "var(--pulse-layout-gutter)", "calc(var(--pulse-space-2) * -1)"]) expect(isAllowedSpacing(v), v).toBe(true);
  });
  it("rejects raw lengths, fallbacks and other variables", () => {
    for (const v of ["20px", "1rem", "0 4px", "var(--pulse-space-2, 5px)", "calc(var(--pulse-space-1) + 3px)", "var(--gap)"]) expect(isAllowedSpacing(v), v).toBe(false);
  });
});

cssTester.run("pulse/no-raw-spacing (CSS)", noRawSpacing, {
  valid: [
    ".a { padding: var(--pulse-layout-panel-padding); gap: var(--pulse-space-2); }",
    ".a { margin: 0 auto; padding-inline: var(--pulse-space-1) var(--pulse-space-2); }",
    ".a { width: 200px; top: 3px; border: 1px solid var(--pulse-color-border); }",
  ],
  invalid: [
    { code: ".a { gap: 20px; }", errors: 1 },
    { code: ".a { padding: 4px 8px; }", errors: 1 },
    { code: ".a { margin-top: 1.5rem; }", errors: 1 },
    { code: ".a { column-gap: calc(var(--pulse-space-1) + 3px); }", errors: 1 },
  ],
});

jsTester.run("pulse/no-raw-spacing (JS)", noRawSpacing, {
  valid: [
    'el.style.padding = "var(--pulse-space-2)";',
    'const label = { padding: "Padding", margin: "Margin" };',
    'el.style.left = "120px";',
    "el.style.gap = computed;",
  ],
  invalid: [
    { code: 'el.style.marginTop = "12px";', errors: 1 },
    { code: "const style = { gap: 8 };", errors: 1 },
    { code: 'h("div", { style: "padding: 5px; color: var(--pulse-color-text)" });', errors: 1 },
    { code: 'el.setAttribute("style", "gap: 10px");', errors: 1 },
  ],
});

cssTester.run("pulse/no-raw-color (CSS, carried forward)", noRawColor, {
  valid: ["a { color: var(--pulse-color-accent); background: transparent; }"],
  invalid: [
    { code: "a { color: #1f5fbf; }", errors: 1 },
    { code: "a { border: 1px solid white; }", errors: 1 },
  ],
});

jsTester.run("pulse/no-raw-color (JS, carried forward)", noRawColor, {
  valid: ['const label = "red";'],
  invalid: [{ code: 'el.style.color = "#1f5fbf";', errors: 1 }],
});

cssTester.run("pulse/no-raw-font-size (CSS, carried forward)", noRawFontSize, {
  valid: ["p { font-size: var(--pulse-font-size-body); }"],
  invalid: [{ code: "p { font-size: 15px; }", errors: 1 }],
});
