// The lesson's review question, as a test: grep every source file outside the
// token folder for a hex colour. The only hit allowed is the brand mark.
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
  it("finds hex colours only in the never-themed brand mark", () => {
    const hits = ["apps", "packages"]
      .flatMap((d) => walk(`${ROOT}${d}`))
      .flatMap((file) =>
        readFileSync(file, "utf-8")
          .split("\n")
          .flatMap((line, i) => (HEX.test(line) ? [`${file.slice(ROOT.length)}:${i + 1}`] : [])),
      );
    expect(new Set(hits.map((h) => h.split(":")[0]))).toEqual(new Set(["apps/control-tower/src/brand/pulse-mark.svg"]));
  });
});
