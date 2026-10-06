// Carried-forward panels from Lessons 2-4 still work on the new grid.
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector("body[data-ready=true]");
});

test("panels sit on the 12-column board, each exactly its span wide", async ({ page }) => {
  const panels = await page.evaluate(() => {
    const board = /** @type {HTMLElement} */ (document.querySelector(".board"));
    const cs = getComputedStyle(board);
    const track = Number.parseFloat(cs.gridTemplateColumns);
    const gutter = Number.parseFloat(cs.columnGap);
    return [...board.querySelectorAll(".panel")].map((el) => {
      const span = Number(getComputedStyle(el).gridColumnStart.replace("span ", ""));
      const expected = span * track + (span - 1) * gutter;
      return [/** @type {HTMLElement} */ (el).dataset.panel, span, Math.abs(el.getBoundingClientRect().width - expected) < 0.5];
    });
  });
  expect(panels).toEqual([
    ["spacing", 5, true],
    ["build", 7, true],
    ["owners", 5, true],
    ["type-scale", 7, true],
    ["contrast", 12, true],
  ]);
});

test("build status shows a card per package (Lesson 2)", async ({ page }) => {
  await expect(page.locator("[data-panel=build] .card")).toHaveCount(8);
});

test("clicking an ownership node highlights its team (Lesson 2)", async ({ page }) => {
  await page.locator('[data-node="@pulse/config"]').click();
  await expect(page.locator("[data-owner-detail]")).toHaveText("@pulse/platform-dx owns @pulse/config, @pulse/control-tower, @pulse/utils.");
  await expect(page.locator(".node.is-team")).toHaveCount(3);
});

test("type scale roles all match (Lesson 3)", async ({ page }) => {
  await expect(page.locator("[data-panel=type-scale] .pulse-badge", { hasText: "Matches" })).toHaveCount(7);
});

test("contrast audit passes 28 of 28 and the theme switch re-themes the page (Lesson 4)", async ({ page }) => {
  await expect(page.locator("[data-contrast-count]")).toHaveText("28 of 28 pass");
  await expect(page.locator("[data-contrast-gate]")).toHaveText("Gate passing");
  await page.getByLabel("Dark").check({ force: true });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByLabel("Light").check({ force: true });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
