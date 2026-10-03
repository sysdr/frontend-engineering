# Verify — Lesson 3 proof criteria

This file matches the article's "The proof" section, command for command.

Every command runs from the repo root (`lesson-03-typography-as-a-system/`).

**1. It builds and the scale is in sync.**

    pnpm install
    pnpm build
    pnpm lint

`pnpm build` ends with `Tasks: 8 successful, 8 total`. `pnpm lint` exits 0 and ends with `OK: typography.css matches tokens/typography.js.`

**2. The tests pass.**

    pnpm test

You see `Tasks: 16 successful, 16 total`, then `Test Files 4 passed (4)` and `Tests 24 passed (24)`.

**3. The lint rule fails on a deliberate `font-size: 15px`.**

    echo '.invoices td { font-size: 15px; }' >> apps/billing/src/invoices/invoices.css
    pnpm lint

It exits 1 with:

    @pulse/billing:lint:   103:16  error  font-size: 15px is not on the type scale. Use var(--pulse-font-size-<role>); the scale lives in packages/design-system/src/tokens/typography.js  pulse/no-raw-font-size
    Failed:    @pulse/billing#lint

Delete that last line from `invoices.css` again and `pnpm lint` exits 0.

**4. The Control Tower panel shows every step with its real computed values.** Run `pnpm dev` and open http://localhost:4100. In the **Type scale** panel you see seven rows, from display down to caption. Each row's Rendered column matches its Token column: 48.83px, 39.06px, 31.25px, 25px, 20px, 16px and 12.8px. The line heights are 64, 52, 44, 36, 28, 24 and 20px, and every row says **Matches**. Seven blue bars climb left to right, and the lint line reads "No hand-typed font sizes in 23 JS and CSS files." Pick **1.5 Perfect fifth** under "Compare ratio": seven dashed bars appear, the smallest one amber, and the sentence ends "caption would be 10.67px, under the 12px floor, and display 121.5px."

**5. The invoice list uses zero manual sizes.** Open http://localhost:4100/billing/invoices/. You see 18 invoices under three totals: $80,789.95 outstanding, $31,694.95 overdue and $80,583.00 collected. Press **Show type roles**. Every text element gets an outline in its role's colour, and the card reads "154 text elements measured. All 154 sit on a type-scale step." Press **Overdue** and the table shows 3 rows under "Overdue invoices".

**6. Drift shows up live.** Keep `pnpm dev` running and the tower open, then repeat the `echo` from step 3. Within a couple of seconds, without a reload, the panel's lint line turns amber: "1 hand-typed font size. pnpm lint will fail." It names `apps/billing/src/invoices/invoices.css:103`. Reload the invoice list and press Show type roles: table cells get dashed red outlines and the card reads "154 text elements measured. 90 use a size that is not on the scale." Delete the line and the panel goes green again.

**7. The same proof, automated in a real browser.**

    pnpm exec playwright install chromium   # once per machine
    pnpm test:e2e

You see `4 passed`. The fourth test performs step 6 and puts `invoices.css` back afterwards.
