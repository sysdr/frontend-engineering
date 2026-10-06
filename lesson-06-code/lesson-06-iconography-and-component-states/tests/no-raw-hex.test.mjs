// Carried forward from Lesson 4: grep every source file outside the token
// folder for a hex colour. The only hit allowed is the never-themed brand
// mark. Lesson 6's icons draw in currentColor, so they pass too.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ROOT = new URL("../", import.meta.url).pathname;
const HEX = /(?<![\w&])#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![\w-])/;
const SKIP = new Set(["node_modules", "dist", ".turbo", "tokens"]);

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    if (SKIP.has(f)) return [];
    const p = `${dir}/${f}`;
    return statSync(p).isDirectory() ? walk(p) : /\.(m?js|css|html|svg)$/.test(f) ? [p] : [];
  });
}

describe("no raw hex outside the token folder", () => {
  it("finds hex colours only in the brand mark", () => {
    const hits = ["apps", "packages"]
      .flatMap((d) => walk(`${ROOT}${d}`))
      .filter((file) => readFileSync(file, "utf-8").split("\n").some((line) => HEX.test(line)))
      .map((f) => f.slice(ROOT.length));
    expect(hits).toEqual(["apps/control-tower/src/brand/pulse-mark.svg"]);
  });
});
