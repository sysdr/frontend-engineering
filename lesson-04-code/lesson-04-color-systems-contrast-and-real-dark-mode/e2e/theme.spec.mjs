import { expect, test } from "@playwright/test";
import { toComputedRgb } from "../packages/design-system/src/tokens/contrast.js";
import { resolveRole } from "../packages/design-system/src/tokens/colors.js";

/** The page background as the browser painted it. */
const bodyBg = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
/** What a role should paint as, in getComputedStyle's format, read from the tokens. */
const painted = (role, theme) => toComputedRgb(resolveRole(role, theme));
const LIGHT_SURFACE = painted("surface", "light");
const DARK_SURFACE = painted("surface", "dark");

test("the switch re-themes every panel of the Control Tower", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
  expect(await bodyBg(page)).toBe(LIGHT_SURFACE);
  const panelBg = () => page.locator("[data-panel=build]").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await panelBg()).toBe(painted("surface-raised", "light"));

  await page.getByLabel("Dark", { exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await bodyBg(page)).toBe(DARK_SURFACE);
  expect(await panelBg()).toBe(painted("surface-raised", "dark"));
  // The brand mark is the one thing that must NOT change.
  await expect(page.locator(".brand img")).toHaveAttribute("src", "./brand/pulse-mark.svg");
});

test("one choice themes both apps, live, across tabs", async ({ context }) => {
  const tower = await context.newPage();
  await tower.goto("/");
  await tower.getByLabel("Dark", { exact: true }).check();

  const invoices = await context.newPage();
  await invoices.goto("/billing/invoices/");
  await expect(invoices.locator("body")).toHaveAttribute("data-ready", "true");
  await expect(invoices.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await bodyBg(invoices)).toBe(DARK_SURFACE);

  // Flip it back in the tower: the open invoice tab follows without a reload.
  await tower.getByLabel("Light", { exact: true }).check();
  await expect(invoices.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await bodyBg(invoices)).toBe(LIGHT_SURFACE);
  await expect(invoices.getByLabel("Light", { exact: true })).toBeChecked();
});

test("System follows the operating system setting", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/billing/invoices/");
  await page.getByLabel("System", { exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("[data-theme-note]")).toHaveText("Following your system: dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("the switch works from the keyboard", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Light", { exact: true }).check();
  await page.getByLabel("Light", { exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
