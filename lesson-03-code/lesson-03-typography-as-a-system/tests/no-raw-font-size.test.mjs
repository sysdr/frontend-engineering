// Lesson 3 — pulse/no-raw-font-size, on JavaScript and on CSS.
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint, RuleTester } from "eslint";
import { describe, expect, it } from "vitest";
import { inlineDeclarations, isAllowedValue, noRawFontSize } from "../packages/config/eslint/no-raw-font-size.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const RULE = "pulse/no-raw-font-size";
const eslint = new ESLint({ cwd: ROOT });

async function lintAs(file, code) {
  const [result] = await eslint.lintText(code, { filePath: join(ROOT, file) });
  return result.messages;
}

describe("the value check", () => {
  it("accepts only scale tokens and reset keywords", () => {
    expect(isAllowedValue("font-size", "var(--pulse-font-size-body)")).toBe(true);
    expect(isAllowedValue("font-size", "inherit")).toBe(true);
    expect(isAllowedValue("font", "inherit")).toBe(true);
    for (const raw of ["15px", "1rem", "0.9em", "larger", "calc(1rem + 1px)", "var(--my-size)"]) {
      expect(isAllowedValue("font-size", raw)).toBe(false);
    }
    expect(isAllowedValue("font", "600 15px/1.2 sans-serif")).toBe(false);
  });

  it("finds declarations inside inline style strings", () => {
    expect(inlineDeclarations("color: red; font-size: 15px")).toEqual([{ property: "font-size", value: "15px" }]);
  });
});

describe("pulse/no-raw-font-size on JavaScript", () => {
  const tester = new RuleTester({ languageOptions: { ecmaVersion: "latest", sourceType: "module" } });
  it("passes tokens and fails hand-picked or computed sizes", () => {
    tester.run("no-raw-font-size", noRawFontSize, {
      valid: [
        { code: 'el.style.fontSize = "var(--pulse-font-size-body)";', filename: "/repo/apps/billing/src/a.js" },
        { code: 'const s = { fontSize: "inherit" };', filename: "/repo/apps/billing/src/a.js" },
        { code: 'el.className = "pulse-text-caption";', filename: "/repo/apps/billing/src/a.js" },
        { code: 'const s = { fontSize: "15px" };', filename: "/repo/packages/design-system/src/tokens/extra.js" },
      ],
      invalid: [
        { code: 'el.style.fontSize = "15px";', filename: "/repo/apps/billing/src/a.js", errors: [{ messageId: "rawFontSize" }] },
        { code: "el.style.fontSize = size;", filename: "/repo/apps/billing/src/a.js", errors: [{ messageId: "dynamicFontSize" }] },
        { code: 'const s = { "font-size": "0.9rem" };', filename: "/repo/apps/billing/src/a.js", errors: [{ messageId: "rawFontSize" }] },
        { code: 'el.style.setProperty("font-size", "15px");', filename: "/repo/apps/billing/src/a.js", errors: [{ messageId: "rawFontSize" }] },
        { code: 'text.setAttribute("font-size", "11");', filename: "/repo/apps/control-tower/src/a.js", errors: [{ messageId: "rawFontSize" }] },
        { code: 'el.innerHTML = `<p style="font-size: 15px">Due</p>`;', filename: "/repo/apps/billing/src/a.js", errors: [{ messageId: "rawFontSize" }] },
      ],
    });
  });
});

describe("pulse/no-raw-font-size on CSS (through the repo's real eslint.config.js)", () => {
  it("fails a deliberately added font-size: 15px", async () => {
    const messages = await lintAs("apps/billing/src/invoices/invoices.css", ".invoices td { font-size: 15px; }\n");
    expect(messages.map((m) => m.ruleId)).toEqual([RULE]);
    expect(messages[0].message).toContain("font-size: 15px is not on the type scale");
    expect(messages[0].line).toBe(1);
  });

  it("fails the font shorthand when it carries a size", async () => {
    const messages = await lintAs("apps/billing/src/invoices/invoices.css", "h1 { font: 700 2rem/1.1 serif; }\n");
    expect(messages.map((m) => m.ruleId)).toEqual([RULE]);
  });

  it("passes a size taken from the scale", async () => {
    const messages = await lintAs("apps/billing/src/invoices/invoices.css", ".invoices td { font-size: var(--pulse-font-size-body); }\n");
    expect(messages).toEqual([]);
  });

  it("leaves the token folder alone (it is where sizes are allowed to live)", async () => {
    const messages = await lintAs("packages/design-system/src/tokens/scratch.css", ":root { font-size: 15px; }\n");
    expect(messages).toEqual([]);
  });
});

describe("the repository as shipped", () => {
  it("has zero hand-typed font sizes anywhere in apps/ or packages/, JS or CSS", async () => {
    const results = await eslint.lintFiles(["apps/*/src/**/*.js", "apps/*/src/**/*.css", "packages/*/src/**/*.js", "packages/*/src/**/*.css"]);
    const found = results.flatMap((r) => r.messages.filter((m) => m.ruleId === RULE).map((m) => `${r.filePath}:${m.line}`));
    expect(found).toEqual([]);
    expect(results.some((r) => r.filePath.endsWith("apps/billing/src/invoices/invoices.css"))).toBe(true);
    expect(results.some((r) => r.filePath.endsWith("apps/control-tower/src/styles.css"))).toBe(true);
  });
});
