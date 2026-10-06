// Lesson 6's second proof, in a real browser: the State gallery shows every
// primitive in five distinct states, the pinned states match the real ones,
// and "disabled" is visible at a glance, not just true in the DOM.
import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import { PNG } from "pngjs";

const ROWS = ["button-primary", "button-secondary", "field"];
const STATES = ["default", "hover", "focus", "active", "disabled"];

/** @param {import("@playwright/test").Page} page */
const ready = async (page) => {
  await page.goto("/");
  await page.waitForSelector("body[data-ready=true]");
};
/** The element whose look a row's states change: the button, or the field's input. @param {string} row */
const target = (row) => (row === "field" ? "input" : ".pulse-button");
/** @param {string} row @param {string} cell */
const sel = (row, cell) => `[data-gallery-row="${row}"] [data-state-cell="${cell}"] ${target(row)}`;
/** stateSignature() from the design system, run on the real page. @param {import("@playwright/test").Page} page @param {string} selector */
const signature = (page, selector) =>
  page.evaluate(async (s) => {
    const { stateSignature } = await import("/packages/design-system/src/components/states.js");
    return stateSignature(/** @type {Element} */ (document.querySelector(s)));
  }, selector);

/**
 * How much of a screenshot's colour moved, from 0 (same colours) to 1 (no
 * colour in common): half the summed difference of two colour histograms,
 * 16 levels per channel. Position plays no part, so the sub-pixel offset
 * between two table cells (anti-aliasing noise, about 0.04) can't pass for
 * a real change.
 * @param {Buffer} a @param {Buffer} b
 */
function colourShift(a, b) {
  const hist = (/** @type {Buffer} */ buf) => {
    const png = PNG.sync.read(buf);
    const n = png.width * png.height;
    /** @type {Map<number, number>} */
    const bins = new Map();
    for (let i = 0; i < png.data.length; i += 4) {
      const bin = ((png.data[i] >> 4) << 8) | ((png.data[i + 1] >> 4) << 4) | (png.data[i + 2] >> 4);
      bins.set(bin, (bins.get(bin) ?? 0) + 1 / n);
    }
    return bins;
  };
  const [A, B] = [hist(a), hist(b)];
  let sum = 0;
  for (const bin of new Set([...A.keys(), ...B.keys()])) sum += Math.abs((A.get(bin) ?? 0) - (B.get(bin) ?? 0));
  return sum / 2;
}

test("every primitive shows five distinct states, in both themes", async ({ page }) => {
  await ready(page);
  for (const theme of ["Light", "Dark"]) {
    await page.getByLabel(theme).check({ force: true });
    for (const row of ROWS) {
      for (const s of STATES) await expect(page.locator(sel(row, s))).toBeVisible();
      await expect(page.locator(`[data-gallery-check="${row}"]`)).toHaveText("5 distinct states");
    }
    await expect(page.locator("[data-gallery-status]")).toHaveText("3 of 3 rows distinct");
  }
});

test("a pinned state looks exactly like the real one", async ({ page }) => {
  await ready(page);
  for (const row of ROWS) {
    const live = page.locator(sel(row, "live"));
    // Hover: the real pointer over the live control.
    await live.hover();
    expect(await signature(page, sel(row, "live")), `${row} hover`).toBe(await signature(page, sel(row, "hover")));
    // Focus: reached with the Tab key, so :focus-visible applies, pointer away.
    await page.mouse.move(0, 0);
    await page.locator("[data-spacing-toggle]").focus();
    for (let i = 0; i < 12 && !(await live.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press("Tab");
    expect(await signature(page, sel(row, "live")), `${row} focus`).toBe(await signature(page, sel(row, "focus")));
    // Active: the pointer held down on it.
    await page.locator("[data-spacing-toggle]").focus();
    const box = /** @type {{ x: number, y: number, width: number, height: number }} */ (await live.boundingBox());
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    expect(await signature(page, sel(row, "live")), `${row} active`).toBe(await signature(page, sel(row, "active")));
    await page.mouse.up();
  }
  await expect(page.locator("[data-gallery-log]")).toHaveText("Pressed the live secondary Button.");
});

test("disabled is visible at a glance, not only in the DOM", async ({ page }) => {
  await ready(page);
  for (const scheme of /** @type {const} */ (["light", "dark"])) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const row of ROWS) {
      const shot = (/** @type {string} */ cell) => page.locator(sel(row, cell)).screenshot();
      // At a glance: at least half of the control's colour has moved.
      expect(colourShift(await shot("default"), await shot("disabled")), `${scheme} ${row}`).toBeGreaterThanOrEqual(0.5);
      // A cue that survives greyscale and colour blindness: the dashed edge.
      expect(await page.locator(sel(row, "disabled")).evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe("dashed");
      await expect(page.locator(sel(row, "disabled"))).toBeDisabled();
    }
  }
});

test("a disabled style switched off is caught, though the DOM still says disabled", async ({ page }) => {
  await ready(page);
  await expect(page.locator("[data-gallery-status]")).toHaveText("3 of 3 rows distinct");
  execFileSync(process.execPath, ["scripts/try-flat-disabled.mjs"]);
  try {
    await ready(page);
    for (const row of ROWS) {
      await expect(page.locator(`[data-gallery-check="${row}"]`)).toHaveText("Disabled looks like Default");
      await expect(page.locator(sel(row, "disabled"))).toBeDisabled();
      expect(colourShift(await page.locator(sel(row, "default")).screenshot(), await page.locator(sel(row, "disabled")).screenshot())).toBeLessThan(0.1);
    }
    await expect(page.locator("[data-gallery-status]")).toHaveText("3 of 3 rows have look-alike states");
  } finally {
    execFileSync(process.execPath, ["scripts/try-flat-disabled.mjs", "--restore"]);
  }
  await ready(page);
  await expect(page.locator("[data-gallery-status]")).toHaveText("3 of 3 rows distinct");
});

test("the Build status Refresh button is really disabled while it fetches", async ({ page }) => {
  await ready(page);
  await page.route("**/api/build", async (route) => {
    await new Promise((r) => setTimeout(r, 600));
    await route.continue();
  });
  const refresh = page.locator("[data-build-refresh]");
  await refresh.click();
  await expect(refresh).toBeDisabled();
  await expect(refresh).toHaveCSS("border-top-style", "dashed");
  await expect(refresh).toBeEnabled();
});
