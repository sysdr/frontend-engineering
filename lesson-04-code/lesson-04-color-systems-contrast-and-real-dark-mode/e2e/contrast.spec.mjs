import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";

const tryBroken = (...args) => execFileSync(process.execPath, ["scripts/try-broken-pair.mjs", ...args], { encoding: "utf-8" });
const gate = () => {
  try {
    return { code: 0, out: execFileSync(process.execPath, ["scripts/check-contrast.mjs"], { encoding: "utf-8", stdio: "pipe" }) };
  } catch (e) {
    return { code: e.status, out: String(e.stderr) };
  }
};

test("every pair passes in both themes, measured from the rendered page", async ({ page }) => {
  await page.goto("/");
  const panel = page.locator("[data-panel=contrast]");
  await expect(panel.locator("[data-contrast-count]")).toHaveText("28 of 28 pass");
  await expect(panel.locator("[data-contrast-gate]")).toHaveAttribute("data-state", "pass");
  await expect(panel.locator("tbody tr[data-state=pass]")).toHaveCount(14);
  // A measured value, not a copied one: white text on the light accent.
  const row = panel.locator('tr[data-pair="on-accent/accent"]');
  await expect(row.locator('[data-theme-cell="light"] [data-ratio]')).toHaveText("6.09:1");
});

test("a deliberately bad dark pairing fails visibly, then recovers", async ({ page }) => {
  await page.goto("/");
  const panel = page.locator("[data-panel=contrast]");
  await expect(panel.locator("[data-contrast-count]")).toHaveText("28 of 28 pass");
  try {
    tryBroken();
    await expect(panel.locator("[data-contrast-count]")).toHaveText("25 of 28 pass", { timeout: 15_000 });
    await expect(panel.locator("[data-contrast-gate]")).toHaveAttribute("data-state", "fail");
    await expect(panel.locator("[data-contrast-gate]")).toContainText("dark: text-muted on surface is 2.54:1, needs 4.5:1");
    const muted = panel.locator('tr[data-pair="text-muted/surface"]');
    await expect(muted.locator('[data-theme-cell="dark"]')).toHaveAttribute("data-state", "fail");
    await expect(muted.locator('[data-theme-cell="light"]')).toHaveAttribute("data-state", "pass");
    await expect(panel.locator("[data-contrast-drift]")).toBeHidden();

    const result = gate();
    expect(result.code).toBe(1);
    expect(result.out).toContain("3 of 28 contrast checks fail WCAG AA.");
  } finally {
    tryBroken("--restore");
  }
  await expect(panel.locator("[data-contrast-count]")).toHaveText("28 of 28 pass", { timeout: 15_000 });
  expect(gate().code).toBe(0);
});
