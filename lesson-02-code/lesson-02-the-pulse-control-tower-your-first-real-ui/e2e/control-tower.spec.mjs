// The lesson's proof, automated: running a build updates the board in place
// with the hit/miss turbo actually recorded, and clicking a graph node
// highlights the team CODEOWNERS really lists.
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

const ROOT = process.cwd();
const TURBO = join(ROOT, "node_modules", ".bin", "turbo");
const BILLING = join(ROOT, "apps", "billing", "src", "index.js");
const build = () => execFileSync(TURBO, ["run", "build", "--summarize"], { cwd: ROOT, stdio: "ignore", env: { ...process.env, TURBO_TELEMETRY_DISABLED: "1" } });

function newestRunSummary() {
  const dir = join(ROOT, ".turbo", "runs");
  const newest = readdirSync(dir).filter((f) => f.endsWith(".json")).sort((a, b) => statSync(join(dir, b)).mtimeMs - statSync(join(dir, a)).mtimeMs)[0];
  return JSON.parse(readFileSync(join(dir, newest), "utf-8"));
}

test.beforeAll(() => build());

test("a build updates the board live, with turbo's real hit/miss per package", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-live]")).toHaveAttribute("data-state", "live");
  await page.evaluate(() => (window.__sameDocument = true));
  const board = page.locator("[data-panel=build-board]");
  const before = await board.getAttribute("data-run-id");

  const original = readFileSync(BILLING, "utf-8");
  try {
    writeFileSync(BILLING, `${original}// touched by the Lesson 2 e2e test\n`);
    build();
    await expect(board).not.toHaveAttribute("data-run-id", before, { timeout: 15_000 });

    const summary = newestRunSummary();
    await expect(board).toHaveAttribute("data-run-id", summary.id);
    for (const task of summary.tasks.filter((t) => t.task === "build")) {
      const expected = task.cache.status === "MISS" ? "miss" : task.cache.source === "REMOTE" ? "hit-remote" : "hit-local";
      await expect(page.locator(`.strip[data-package="${task.package}"]`)).toHaveAttribute("data-status", expected);
    }
    await expect(page.locator('.strip[data-package="@pulse/billing"]')).toHaveAttribute("data-status", "miss");
    await expect(page.locator('.strip[data-package="@pulse/shell"]')).toHaveAttribute("data-status", "hit-local");
    expect(await page.evaluate(() => window.__sameDocument)).toBe(true);
    await page.screenshot({ path: "test-results/control-tower-after-build.png", fullPage: true });
  } finally {
    writeFileSync(BILLING, original);
  }
});

test("clicking a node in the ownership graph highlights its CODEOWNERS team", async ({ page }) => {
  await page.goto("/");
  await page.locator('g.node[data-package="@pulse/billing"]').click();
  await expect(page.locator(".team-chip.lit")).toHaveCount(1);
  await expect(page.locator(".team-chip.lit")).toHaveAttribute("data-team", "@pulse/billing-team");
  await expect(page.locator("[data-approvers]")).toHaveText("Approvals needed from billing-team.");
  await expect(page.locator('g.node[data-package="@pulse/shell"]')).toHaveClass(/dim/);

  await page.locator('.team-chip[data-team="@pulse/platform-team"]').click();
  await expect(page.locator("g.node.lit")).toHaveCount(5);
  await page.screenshot({ path: "test-results/control-tower-platform-team.png", fullPage: true });
});

test("keyboard alone can select a package", async ({ page }) => {
  await page.goto("/");
  await page.locator('g.node[data-package="@pulse/admin"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('g.node[data-package="@pulse/admin"]')).toHaveAttribute("aria-pressed", "true");
});

test("on a phone-width screen the page never scrolls sideways", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  await expect(page.locator(".strip")).toHaveCount(8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
