# Test

    pnpm test

Runs every package's `node --test` suite through turbo (after `build`), then
the root Vitest suite. Expected:

     Tasks:    16 successful, 16 total
     Test Files  4 passed (4)
          Tests  24 passed (24)

What the Vitest files cover:

- `tests/type-scale.test.mjs` — the ratio holds between every pair of steps,
  the documented sizes and line heights, the 12px floor, and that the
  committed `typography.css` is exactly what `typography.js` generates.
- `tests/no-raw-font-size.test.mjs` — the rule on JavaScript (RuleTester) and
  on CSS through the repo's real `eslint.config.js`, including a deliberate
  `font-size: 15px` in `invoices.css`; and the whole repo at zero violations.
- `tests/type-audit.test.mjs` — the runtime audit matches sizes to roles and
  reports off-scale text.
- `tests/control-tower-data.test.mjs` — the tower snapshot (turbo graph,
  new control-tower → design-system edge, type-lint result) and the dev
  server's static mounts, including path-traversal refusal.

`apps/billing/test/invoices.test.js` (run by turbo) checks the invoice list's
model against the built package: 18 invoices pass the contract, view counts,
totals in cents, and sorting.

## End-to-end, in a real browser

Once per machine:

    pnpm exec playwright install chromium

Then:

    pnpm test:e2e

Starts the dev server on port 4180 and runs 4 Playwright tests. Expected:

    4 passed

The fourth test writes `font-size: 15px` into `invoices.css`, checks that the
panel and the page both report it, and restores the file.
