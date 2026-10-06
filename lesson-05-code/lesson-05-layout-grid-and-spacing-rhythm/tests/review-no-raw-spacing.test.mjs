// The lesson's review question, as a test: every margin, padding and gap
// declared in any stylesheet outside the token folder is a token reference.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isAllowedSpacing } from "../packages/config/eslint/no-raw-spacing.js";

const ROOT = new URL("../", import.meta.url).pathname;
const SKIP = new Set(["node_modules", "dist", ".turbo", "tokens"]);
const DECL = /(?:^|[;{\s])((?:margin|padding|gap|row-gap|column-gap)(?:-[a-z-]+)?)\s*:\s*([^;}]+)/g;

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    if (SKIP.has(f)) return [];
    const p = `${dir}/${f}`;
    return statSync(p).isDirectory() ? walk(p) : f.endsWith(".css") ? [p] : [];
  });
}

describe("no raw spacing outside the token folder", () => {
  const files = ["apps", "packages"].flatMap((d) => walk(`${ROOT}${d}`));
  it("finds the stylesheets", () => expect(files.length).toBeGreaterThanOrEqual(4));
  it("has a token reference for every margin, padding and gap", () => {
    const bad = files.flatMap((file) =>
      [...readFileSync(file, "utf-8").replace(/\/\*[\s\S]*?\*\//g, "").matchAll(DECL)]
        .filter(([, , value]) => !isAllowedSpacing(value))
        .map(([, prop, value]) => `${file.slice(ROOT.length)}: ${prop}: ${value.trim()}`),
    );
    expect(bad).toEqual([]);
  });
});
