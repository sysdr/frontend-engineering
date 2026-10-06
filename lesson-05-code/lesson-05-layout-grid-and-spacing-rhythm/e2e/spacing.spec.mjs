// Lesson 5's proof, in a real browser against the real dev server.
import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";

const ready = async (/** @type {import("@playwright/test").Page} */ page, path = "/") => {
  await page.goto(path);
  await page.waitForSelector("body[data-ready=true]");
  // Let the overlay's scheduled re-measure run after the panels settle.
  await page.waitForTimeout(300);
};

/** Every element's box, outside the overlay layer, plus the page's scroll size. */
const layoutSnapshot = (/** @type {import("@playwright/test").Page} */ page) =>
  page.evaluate(() => {
    const boxes = [...document.body.querySelectorAll("*")]
      .filter((el) => !el.closest("[data-spacing-overlay]"))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return [r.x, r.y, r.width, r.height].map((n) => Math.round(n * 100) / 100).join(",");
      });
    return { boxes, scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight] };
  });

test("every measured space in the Control Tower is a multiple of 8px", async ({ page }) => {
  await ready(page);
  await page.getByRole("button", { name: "Spacing overlay" }).click();
  const counts = page.locator("[data-spacing-counts]");
  await expect(counts).toHaveAttribute("data-off-grid", "0");
  expect(Number(await counts.getAttribute("data-total"))).toBeGreaterThan(500);
  await expect(page.locator("[data-spacing-status]")).toHaveText(/^All \d+ on the 8px grid$/);

  const regions = await page.locator(".pulse-spacing-region:not([data-kind=column])").evaluateAll((els) =>
    els.map((el) => ({ status: /** @type {HTMLElement} */ (el).dataset.status, px: Number(/** @type {HTMLElement} */ (el).dataset.px) })),
  );
  expect(regions.length).toBeGreaterThan(500);
  expect(regions.filter((r) => r.status === "off-grid")).toEqual([]);
  for (const r of regions.filter((x) => x.status !== "free")) expect(r.px % 8).toBe(0);
  expect(await page.locator(".pulse-spacing-overlay .pulse-spacing-label").count()).toBeGreaterThan(50);
  // The 12 column guides of the board grid are drawn too.
  await expect(page.locator(".pulse-spacing-region[data-kind=column]")).toHaveCount(12);
});

test("turning the overlay on and off moves nothing", async ({ page }) => {
  await ready(page);
  const before = await layoutSnapshot(page);
  const toggle = page.getByRole("button", { name: "Spacing overlay" });
  await toggle.click();
  await expect(page.locator("[data-spacing-overlay]")).toBeVisible();
  await page.waitForTimeout(200);
  expect(await layoutSnapshot(page)).toEqual(before);
  await toggle.click();
  await expect(page.locator("[data-spacing-overlay]")).toBeHidden();
  expect(await layoutSnapshot(page)).toEqual(before);
});

test("the toggle works from the keyboard and survives a reload", async ({ page }) => {
  await ready(page);
  const toggle = page.getByRole("button", { name: "Spacing overlay" });
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await page.waitForSelector("body[data-ready=true]");
  await expect(page.getByRole("button", { name: "Spacing overlay" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-spacing-overlay]")).toBeVisible();
  await page.getByRole("button", { name: "Spacing overlay" }).press("Space");
  await expect(page.locator("[data-spacing-overlay]")).toBeHidden();
});

test("the overlay stays on its elements while the page scrolls", async ({ page }) => {
  await ready(page);
  await page.getByRole("button", { name: "Spacing overlay" }).click();
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(200);
  const [panelTop, stripTop] = await page.evaluate(() => {
    const panel = /** @type {HTMLElement} */ (document.querySelector('[data-panel="contrast"]'));
    const top = panel.getBoundingClientRect().top + Number.parseFloat(getComputedStyle(panel).borderTopWidth);
    // The contrast panel's top padding strip: 24px tall, full panel width, starting just inside the border.
    const strip = [...document.querySelectorAll(".pulse-spacing-region[data-kind=padding]")]
      .map((el) => el.getBoundingClientRect())
      .find((r) => Math.abs(r.top - top) < 1 && Math.abs(r.height - 24) < 0.1 && r.width > 1000);
    return [top, strip?.top ?? Number.NaN];
  });
  expect(stripTop).toBeCloseTo(panelTop, 1);
});

test("the Spacing panel measures every step and reads the grid back", async ({ page }) => {
  await ready(page);
  await expect(page.locator("[data-spacing-scale] tbody tr")).toHaveCount(6);
  await expect(page.locator("[data-spacing-scale] .pulse-badge", { hasText: "Matches" })).toHaveCount(6);
  const fact = (/** @type {string} */ key) => page.locator(`[data-fact="${key}"] dd`).first();
  await expect(fact("columns")).toHaveText("12");
  await expect(fact("gutter")).toHaveText("24px");
  await expect(fact("page-margin")).toHaveText("32px");
  await expect(fact("panel-padding")).toHaveText("24px");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(fact("gutter")).toHaveText("16px");
  await expect(page.locator('[data-fact="gutter"] dd').nth(1)).toHaveText("role gutter, space-2");
});

test("browser default margins come back without the reset, and only the overlay sees them", async ({ page }) => {
  await ready(page);
  await expect(page.locator("[data-spacing-counts]")).toHaveAttribute("data-off-grid", "0");
  execFileSync(process.execPath, ["scripts/try-off-grid.mjs"]);
  try {
    await ready(page);
    const off = Number(await page.locator("[data-spacing-counts]").getAttribute("data-off-grid"));
    expect(off).toBeGreaterThan(20);
    await expect(page.locator("[data-spacing-status]")).toHaveText(`${off} off the grid`);
    await page.getByRole("button", { name: "Spacing overlay" }).click();
    // Every panel title's default h2 margin (0.83em of 20px) is flagged.
    const h2 = await page.evaluate(() => getComputedStyle(/** @type {Element} */ (document.querySelector("h2"))).marginTop);
    expect(h2).toBe("16.6px");
    await expect(page.locator(".pulse-spacing-label[data-status=off-grid]", { hasText: /^16\.6$/ }).first()).toBeVisible();
  } finally {
    execFileSync(process.execPath, ["scripts/try-off-grid.mjs", "--restore"]);
  }
  await ready(page);
  await expect(page.locator("[data-spacing-counts]")).toHaveAttribute("data-off-grid", "0");
});

test("the invoice list sits on the same grid", async ({ page }) => {
  await ready(page, "/billing/invoices/");
  await page.getByRole("button", { name: "Spacing overlay" }).click();
  await expect(page.locator(".pulse-spacing-region[data-status=off-grid]")).toHaveCount(0);
  expect(await page.locator(".pulse-spacing-region[data-kind=padding]").count()).toBeGreaterThan(100);
});
