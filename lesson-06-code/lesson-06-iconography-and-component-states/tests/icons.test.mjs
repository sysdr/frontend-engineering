// Lesson 6's first proof: every icon shares one stroke width and corner
// radius, checked by reading the .svg source itself.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ICON_BUDGET, ICON_GRID, checkIcon } from "../packages/design-system/src/icons/convention.js";
import { ICONS } from "../packages/design-system/src/icons/icons.js";
import { iconFiles } from "../scripts/generate-tokens.mjs";
import { checkAllIcons } from "../scripts/check-icons.mjs";
import { makeEven, makeOdd } from "../scripts/try-odd-icon.mjs";

const ROOT_TAG = `<svg ${Object.entries(ICON_GRID.root).map(([k, v]) => `${k}="${v}"`).join(" ")}>`;
/** @param {string} body */
const icon = (body) => `${ROOT_TAG}\n  ${body}\n</svg>\n`;

describe("the shipped set", () => {
  const files = iconFiles();

  it("has between 8 and 10 icons, inside the budget", () => {
    expect(files.length).toBeGreaterThanOrEqual(8);
    expect(files.length).toBeLessThanOrEqual(10);
    expect(files.length).toBeLessThanOrEqual(ICON_BUDGET);
  });

  it("gives every file the same root: 24 viewBox, stroke 2, round caps and joins", () => {
    for (const { file } of files) {
      const { attrs } = checkIcon(readFileSync(file, "utf-8"));
      expect(attrs, file).toEqual(ICON_GRID.root);
    }
  });

  it("rounds every rectangle with the same 2-unit radius", () => {
    const rects = files.flatMap(({ file }) => checkIcon(readFileSync(file, "utf-8")).shapes.filter((s) => s.tag === "rect"));
    expect(rects.length).toBeGreaterThan(0);
    for (const r of rects) expect(r.attrs.rx).toBe("2");
  });

  it("passes every check, and every icon is used by some code", () => {
    expect(checkAllIcons().filter((r) => r.problems.length)).toEqual([]);
  });

  it("is what icons.js renders from", () => {
    expect(Object.keys(ICONS)).toEqual(files.map((f) => f.name));
    for (const name of Object.keys(ICONS)) expect(ICONS[/** @type {keyof typeof ICONS} */ (name)].attrs["stroke-width"]).toBe("2");
  });
});

describe("checkIcon catches an icon from a different pack", () => {
  it("a 1.5 stroke", () => {
    expect(checkIcon(makeOdd(icon('<circle cx="12" cy="12" r="9"/>'))).problems).toEqual(['stroke-width is "1.5"; the grid says "2"']);
  });
  it("a shape that sets its own stroke width", () => {
    expect(checkIcon(icon('<path d="M4 12H20" stroke-width="3"/>')).problems).toEqual(['<path> sets its own stroke-width="3"']);
  });
  it("a sharp or differently rounded rectangle", () => {
    expect(checkIcon(icon('<rect x="3" y="3" width="18" height="18"/>')).problems).toEqual(["<rect> corner radius is 0; the grid says 2"]);
    expect(checkIcon(icon('<rect x="3" y="3" width="18" height="18" rx="4"/>')).problems).toEqual(["<rect> corner radius is 4; the grid says 2"]);
  });
  it("a point outside the live area", () => {
    expect(checkIcon(icon('<path d="M1 12H23"/>')).problems).toEqual(["<path> reaches 1,12, outside the 2-22 live area"]);
  });
  it("relative path commands, which hide where the points are", () => {
    expect(checkIcon(icon('<path d="M4 12h16"/>')).problems[0]).toMatch(/^path uses "h"/);
  });
  it("square line caps and extra root attributes", () => {
    const src = ROOT_TAG.replace('stroke-linecap="round"', 'stroke-linecap="square" class="lucide"');
    expect(checkIcon(`${src}<path d="M4 12H20"/></svg>`).problems).toEqual(['stroke-linecap is "square"; the grid says "round"', "root has an extra class attribute"]);
  });
  it("and try-odd-icon undoes itself exactly", () => {
    const src = icon('<circle cx="12" cy="12" r="9"/>');
    expect(makeEven(makeOdd(src))).toBe(src);
  });
});
