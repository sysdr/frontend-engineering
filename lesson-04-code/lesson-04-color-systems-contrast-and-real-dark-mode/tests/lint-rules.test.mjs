import { RuleTester } from "eslint";
import css from "@eslint/css";
import { describe, expect, it } from "vitest";
import noRawColor, { findRawColor } from "../packages/config/eslint/no-raw-color.js";
import noRawFontSize from "../packages/config/eslint/no-raw-font-size.js";

RuleTester.describe = describe;
RuleTester.it = it;

const cssTester = new RuleTester({ plugins: { css }, language: "css/css" });
const jsTester = new RuleTester({ languageOptions: { ecmaVersion: "latest", sourceType: "module" } });

describe("findRawColor", () => {
  it("finds hex, colour functions and named colours, and nothing in role names", () => {
    expect(findRawColor("#fff")).toBe("#fff");
    expect(findRawColor("1px solid rgb(0 0 0)")).toBe("rgb()");
    expect(findRawColor("1px solid white")).toBe("white");
    expect(findRawColor("var(--pulse-color-danger-text)")).toBeNull();
    expect(findRawColor("var(--pulse-color-red)")).toBeNull();
    expect(findRawColor("transparent")).toBeNull();
    expect(findRawColor("currentColor")).toBeNull();
  });
});

cssTester.run("pulse/no-raw-color (CSS)", noRawColor, {
  valid: [
    "a { color: var(--pulse-color-accent); }",
    "a { border: 1px solid var(--pulse-color-border); background: transparent; fill: currentColor; }",
    "a { box-shadow: 0 0 0 3px var(--pulse-color-focus-ring); }",
  ],
  invalid: [
    { code: "a { color: #1f5fbf; }", errors: 1 },
    { code: "a { background: rgb(13, 19, 28); }", errors: 1 },
    { code: "a { border: 1px solid white; }", errors: 1 },
    { code: "a { --brand: #ff0000; }", errors: 1 },
    { code: "a { color: var(--pulse-color-text, #000); }", errors: 1 },
  ],
});

jsTester.run("pulse/no-raw-color (JS)", noRawColor, {
  valid: ['el.style.color = "var(--pulse-color-text)";', 'document.querySelector("#rows");', 'const label = "red";'],
  invalid: [
    { code: 'el.style.color = "#1f5fbf";', errors: 1 },
    { code: "const c = `rgb(0, 0, 0)`;", errors: 1 },
    { code: 'h("span", { style: "background: #fff" });', errors: 1 },
  ],
});

cssTester.run("pulse/no-raw-font-size (CSS, carried forward)", noRawFontSize, {
  valid: ["p { font-size: var(--pulse-font-size-body); }", "p { font-size: inherit; }"],
  invalid: [{ code: "p { font-size: 15px; }", errors: 1 }],
});

jsTester.run("pulse/no-raw-font-size (JS, carried forward)", noRawFontSize, {
  valid: ['el.style.fontSize = "var(--pulse-font-size-caption)";'],
  invalid: [
    { code: 'el.style.fontSize = "15px";', errors: 1 },
    { code: 's("text", { "font-size": 12 });', errors: 1 },
  ],
});
