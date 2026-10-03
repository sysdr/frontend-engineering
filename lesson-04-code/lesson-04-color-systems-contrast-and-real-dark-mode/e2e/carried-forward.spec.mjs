import { expect, test } from "@playwright/test";

test("Lesson 2 panels still work, now in theme colours", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-panel=build] [data-package]")).toHaveCount(8);
  await page.locator('[data-node="@pulse/billing"]').click();
  await expect(page.locator("[data-owner-detail]")).toContainText("owned by @pulse/billing");
});

test("Lesson 3 type scale still measures true", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-panel=type-scale] li")).toHaveCount(7);
  await expect(page.locator("[data-panel=type-scale] .pulse-badge", { hasText: "Matches" })).toHaveCount(7);
});
