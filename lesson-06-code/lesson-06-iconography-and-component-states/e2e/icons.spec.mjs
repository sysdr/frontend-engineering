// Lesson 6's first proof, in a real browser: ten icons on one grid, used all
// over the Control Tower, and an icon drawn off the grid caught twice.
import { execFileSync, spawnSync } from "node:child_process";
import { expect, test } from "@playwright/test";

/** @param {import("@playwright/test").Page} page */
const ready = async (page) => {
  await page.goto("/");
  await page.waitForSelector("body[data-ready=true]");
};

test("every icon on the board is drawn from the one grid", async ({ page }) => {
  await ready(page);
  await expect(page.locator("[data-icon-tile]")).toHaveCount(10);
  await expect(page.locator("[data-icon-tile] .pulse-badge", { hasText: "On grid" })).toHaveCount(10);
  await expect(page.locator("[data-icon-status]")).toHaveText("10 of 10 on the grid");
  const icons = await page.locator("svg.pulse-icon").evaluateAll((els) =>
    els.map((el) => [el.getAttribute("data-icon"), el.getAttribute("viewBox"), el.getAttribute("stroke-width"), el.getAttribute("stroke-linecap"), el.getAttribute("stroke-linejoin")].join(" ")),
  );
  expect(icons.length).toBeGreaterThan(100);
  expect(new Set(icons.map((i) => i.split(" ")[0])).size).toBe(10);
  for (const i of icons) expect(i).toMatch(/^\w+ 0 0 24 24 2 round round$/);
});

test("icons sit in the top bar, the badges and the build cards", async ({ page }) => {
  await ready(page);
  await expect(page.locator("[data-spacing-toggle] svg")).toHaveAttribute("data-icon", "grid");
  await expect(page.locator(".pulse-segmented svg")).toHaveCount(3);
  await expect(page.locator('[data-panel="build"] .card svg[data-icon="package"]').first()).toBeVisible();
  await expect(page.locator('[data-contrast-count] svg[data-icon="check"]')).toBeVisible();
});

test("picking a tile shows that file's own source", async ({ page }) => {
  await ready(page);
  await page.locator('[data-icon-tile="refresh"]').click();
  await expect(page.locator('[data-icon-tile="refresh"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-icon-file]")).toHaveText("packages/design-system/src/icons/refresh.svg");
  await expect(page.locator("[data-icon-source] mark", { hasText: 'stroke-width="2"' })).toBeVisible();
  await expect(page.locator("[data-icon-source] mark[data-off]")).toHaveCount(0);
});

test("an icon off the grid fails lint and turns red on the board", async ({ page }) => {
  await ready(page);
  execFileSync(process.execPath, ["scripts/try-odd-icon.mjs"]);
  try {
    const lint = spawnSync(process.execPath, ["scripts/check-icons.mjs"], { encoding: "utf-8" });
    expect(lint.status).toBe(1);
    expect(lint.stderr).toContain('FAIL: packages/design-system/src/icons/refresh.svg: stroke-width is "1.5"; the grid says "2"');
    await ready(page);
    await expect(page.locator("[data-icon-status]")).toHaveText("1 off the grid");
    await expect(page.locator('[data-icon-tile="refresh"] .pulse-badge')).toHaveText("Off grid");
    await expect(page.locator("[data-icon-source] mark[data-off]")).toHaveText('stroke-width="1.5"');
    await expect(page.locator("[data-icon-problems]")).toContainText('stroke-width is "1.5"; the grid says "2"');
    // The thin stroke is not only reported: every refresh icon renders with it.
    await expect(page.locator('[data-build-refresh] svg[data-icon="refresh"]')).toHaveAttribute("stroke-width", "1.5");
  } finally {
    execFileSync(process.execPath, ["scripts/try-odd-icon.mjs", "--restore"]);
  }
  expect(spawnSync(process.execPath, ["scripts/check-icons.mjs"]).status).toBe(0);
  await ready(page);
  await expect(page.locator("[data-icon-status]")).toHaveText("10 of 10 on the grid");
});
