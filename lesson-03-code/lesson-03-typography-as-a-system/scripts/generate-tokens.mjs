#!/usr/bin/env node
// `pnpm tokens`          writes packages/design-system/src/tokens/typography.css
// `pnpm tokens --check`  exits 1 if that file is not exactly what
//                        typography.js generates (run by `pnpm lint`)
// The JS module is the single source; the CSS file is its generated output,
// committed so stylesheets and plain HTML pages can load it with no build step.
// (Lesson 12 replaces this script with a Style Dictionary pipeline.)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { typographyCss } from "../packages/design-system/src/tokens/typography.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const TOKEN_CSS = join(ROOT, "packages", "design-system", "src", "tokens", "typography.css");

const expected = typographyCss();
if (process.argv.includes("--check")) {
  let actual = "";
  try {
    actual = readFileSync(TOKEN_CSS, "utf-8");
  } catch {
    // missing file is drift too
  }
  if (actual !== expected) {
    console.error("FAIL: packages/design-system/src/tokens/typography.css is out of date. Run `pnpm tokens`.");
    process.exit(1);
  }
  console.log("OK: typography.css matches tokens/typography.js.");
} else {
  writeFileSync(TOKEN_CSS, expected);
  console.log(`wrote packages/design-system/src/tokens/typography.css (${expected.split("\n").length - 1} lines)`);
}
