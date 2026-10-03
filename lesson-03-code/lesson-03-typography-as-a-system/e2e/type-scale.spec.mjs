// Lesson 3 proof, in a real browser.
import { readFileSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const ROLES = ["display", "headline", "title", "heading", "subheading", "body", "caption"];
const TOKEN_PX = { caption: 12.8, body: 16, subheading: 20, heading: 25, title: 31.25, headline: 39.0625, display: 48.828125 };
const INVOICE_CSS = new URL("../apps/billing/src/invoices/invoices.css", import.meta.url);

test("the Control Tower's type-scale panel shows every step, measured from the page", async ({ page }) => {
  await page.goto("/");
  const panel = page.locator("[data-panel=type-scale]");
  await expect(panel.locator("tbody tr")).toHaveCount(7);
  await expect(panel).toHaveAttribute("data-all-match", "true");
  for (const role of ROLES) {
    const row = panel.locator(`tr[data-role=${role}]`);
    const rendered = Number(await row.locator("[data-rendered-px]").getAttribute("data-rendered-px"));
    expect(rendered).toBeCloseTo(TOKEN_PX[role], 2);
    await expect(row).toContainText("Matches");
  }
  await expect(panel.locator("[data-type-lint]")).toHaveAttribute("data-state", "clean");
  await expect(panel.locator("rect.stair")).toHaveCount(7);
});

test("picking another ratio draws its stairs beside the shipped ones", async ({ page }) => {
  await page.goto("/");
  const panel = page.locator("[data-panel=type-scale]");
  await expect(panel.locator("rect.ghost")).toHaveCount(0);
  await panel.locator("[data-compare]").selectOption("1.5");
  await expect(panel.locator("rect.ghost")).toHaveCount(7);
  await expect(panel.locator("rect.ghost.too-small")).toHaveCount(1);
  await expect(panel.locator("[data-type-sentence]")).toContainText("display 121.5px");
});

test("the invoice list renders with every text element on a scale step", async ({ page }) => {
  await page.goto("/billing/invoices/");
  await expect(page.locator("[data-rows] tr")).toHaveCount(18);
  await expect(page.locator("body")).toHaveAttribute("data-audit-off-scale", "0");
  expect(Number(await page.locator("body").getAttribute("data-audit-total"))).toBeGreaterThan(100);

  await expect(page.locator("[data-audit]")).toBeHidden();
  await page.getByRole("button", { name: "Show type roles" }).click();
  await expect(page.locator("[data-audit]")).toBeVisible();
  await expect(page.locator("[data-audit-sentence]")).toContainText("sit on a type-scale step");
  await page.locator("[data-view=overdue]").click();
  await expect(page.locator("[data-rows] tr")).toHaveCount(3);
  await expect(page.locator("[data-list-title]")).toHaveText("Overdue invoices");
  await page.getByRole("button", { name: "Amount" }).click();
  await expect(page.locator("[data-rows] tr").first()).toHaveAttribute("data-invoice", "INV-2035");
  await expect(page.locator("body")).toHaveAttribute("data-audit-off-scale", "0");
});

test("a hand-typed font-size: 15px shows up live in the panel and on the page", async ({ page }) => {
  const original = readFileSync(INVOICE_CSS, "utf-8");
  try {
    await page.goto("/");
    const lint = page.locator("[data-panel=type-scale] [data-type-lint]");
    await expect(lint).toHaveAttribute("data-state", "clean");
    writeFileSync(INVOICE_CSS, `${original}.invoices td { font-size: 15px; }\n`);
    await expect(lint).toHaveAttribute("data-state", "failing", { timeout: 20000 });
    await expect(lint).toContainText("apps/billing/src/invoices/invoices.css");
    await expect(lint).toContainText("font-size: 15px is not on the type scale");

    const invoices = await page.context().newPage();
    await invoices.goto("/billing/invoices/");
    await expect(invoices.locator("[data-rows] tr")).toHaveCount(18);
    expect(Number(await invoices.locator("body").getAttribute("data-audit-off-scale"))).toBeGreaterThanOrEqual(18 * 5);
  } finally {
    writeFileSync(INVOICE_CSS, original);
  }
  await expect(page.locator("[data-panel=type-scale] [data-type-lint]")).toHaveAttribute("data-state", "clean", { timeout: 20000 });
});
