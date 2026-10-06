# Test

## Unit and rule tests

    pnpm test

This first runs turbo's per-package smoke test. Every built module must parse,
and Node-importable entry points must import cleanly. Then it runs Vitest.
Expected:

     Tasks:    16 successful, 16 total
     ...
     ✓ tests/lint-rules.test.mjs (24 tests)
     ✓ tests/spacing-tokens.test.mjs (9 tests)
     ✓ tests/spacing-audit.test.mjs (6 tests)
     ✓ tests/contrast.test.mjs (3 tests)
     ✓ tests/no-raw-hex.test.mjs (1 test)
     ✓ tests/theme.test.mjs (4 tests)
     ✓ tests/review-no-raw-spacing.test.mjs (2 tests)
     ✓ tests/typography.test.mjs (2 tests)
     ✓ tests/try-off-grid.test.mjs (3 tests)
     Test Files  9 passed (9)
          Tests  54 passed (54)

The files may finish in a different order.

What the Lesson 5 tests cover:

- `spacing-tokens`: the scale is 8, 16, 24, 32, 48 and 64px, every layout
  role points at a real step, and `classifyLength` tells a step, a whole
  multiple and an off-grid value apart. The generated CSS has every variable
  and all 12 span classes, and matches the committed file.
- `spacing-audit`: the gap maths on fixed boxes. That means rows, a wrapped
  row whose line gap comes from its tallest item, columns and grid rows.
  Free gaps are not counted.
- `lint-rules`: `pulse/no-raw-spacing` on valid and invalid CSS and JS, plus
  the carried-forward colour and font-size rules.
- `review-no-raw-spacing`: the lesson's review question as a grep. Every
  margin, padding and gap in every stylesheet outside the token folder must
  be a token reference.
- `try-off-grid`: the demo script switches the reset off, idempotently, and
  restores the file byte for byte.

## Browser tests

These run in real Chromium against the real dev server, on port 4199.

    pnpm exec playwright install chromium   # once, if Playwright has no browser yet
    pnpm test:e2e

Expected:

    ✓  1 carried-forward.spec.mjs › panels sit on the 12-column board, each exactly its span wide
    ✓  2 carried-forward.spec.mjs › build status shows a card per package (Lesson 2)
    ✓  3 carried-forward.spec.mjs › clicking an ownership node highlights its team (Lesson 2)
    ✓  4 carried-forward.spec.mjs › type scale roles all match (Lesson 3)
    ✓  5 carried-forward.spec.mjs › contrast audit passes 28 of 28 and the theme switch re-themes the page (Lesson 4)
    ✓  6 spacing.spec.mjs › every measured space in the Control Tower is a multiple of 8px
    ✓  7 spacing.spec.mjs › turning the overlay on and off moves nothing
    ✓  8 spacing.spec.mjs › the toggle works from the keyboard and survives a reload
    ✓  9 spacing.spec.mjs › the overlay stays on its elements while the page scrolls
    ✓ 10 spacing.spec.mjs › the Spacing panel measures every step and reads the grid back
    ✓ 11 spacing.spec.mjs › browser default margins come back without the reset, and only the overlay sees them
    ✓ 12 spacing.spec.mjs › the invoice list sits on the same grid
    12 passed

Test 11 edits `base.css` through `pnpm try-off-grid` and always restores it in
a `finally` block. Tests run one at a time (`workers: 1`) for that reason.
