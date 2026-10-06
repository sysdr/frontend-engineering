# Test

## Unit and rule tests

    pnpm test

This first runs turbo's per-package smoke test. Every built module must parse,
and Node-importable entry points must import cleanly. Then it runs Vitest.
Expected:

     Tasks:    16 successful, 16 total
     ...
     ✓ tests/states-css.test.mjs (9 tests)
     ✓ tests/lint-rules.test.mjs (24 tests)
     ✓ tests/components.test.mjs (13 tests)
     ✓ tests/spacing-tokens.test.mjs (9 tests)
     ✓ tests/icons.test.mjs (12 tests)
     ✓ tests/theme.test.mjs (4 tests)
     ✓ tests/spacing-audit.test.mjs (6 tests)
     ✓ tests/no-raw-hex.test.mjs (1 test)
     ✓ tests/contrast.test.mjs (3 tests)
     ✓ tests/review-no-raw-spacing.test.mjs (2 tests)
     ✓ tests/typography.test.mjs (2 tests)
     ✓ tests/try-off-grid.test.mjs (3 tests)
     Test Files  12 passed (12)
          Tests  88 passed (88)

The files may finish in a different order.

What the Lesson 6 tests cover:

- `icons`:
  - every shipped file has the same root attributes and every rectangle the
    same 2-unit radius;
  - every icon passes the check and is used by some code;
  - `icons.js` matches the files;
  - `checkIcon` catches each way an icon from another pack goes wrong: a 1.5
    stroke, a shape with its own stroke width, a sharp or 4-unit corner, a
    point outside the live area, relative path commands, square caps and
    extra root attributes.
- `components` (in jsdom):
  - `createIcon` attributes and labels;
  - `createButton` needs a label, uses a real `type=button` and the native
    `disabled` (a disabled button never fires), supports `aria-pressed`, and
    only lets hover, focus and active be pinned;
  - `createFormField` wires label/for, hint and error through
    `aria-describedby`, and sets `aria-invalid`;
  - badges swap their icon with their tone;
  - `sameLooking` names exactly the states that look alike.
- `states-css`: for both primitives, each pinned state shares one CSS rule
  with its real pseudo-class; disabled is one rule for both, with a dashed
  edge; `try-flat-disabled` restores the file byte for byte.
- `contrast`: now 36 checks, including the hovered and pressed button
  colours.

## Browser tests

These run in real Chromium against the real dev server, on port 4199.

    pnpm exec playwright install chromium   # once, if Playwright has no browser yet
    pnpm test:e2e

Expected:

    ✓  1 carried-forward.spec.mjs › panels sit on the 12-column board, each exactly its span wide
    ✓  2 carried-forward.spec.mjs › build status shows a card per package (Lesson 2)
    ✓  3 carried-forward.spec.mjs › clicking an ownership node highlights its team (Lesson 2)
    ✓  4 carried-forward.spec.mjs › type scale roles all match (Lesson 3)
    ✓  5 carried-forward.spec.mjs › contrast audit passes 36 of 36 and the theme switch re-themes the page (Lesson 4)
    ✓  6 icons.spec.mjs › every icon on the board is drawn from the one grid
    ✓  7 icons.spec.mjs › icons sit in the top bar, the badges and the build cards
    ✓  8 icons.spec.mjs › picking a tile shows that file's own source
    ✓  9 icons.spec.mjs › an icon off the grid fails lint and turns red on the board
    ✓ 10-16 spacing.spec.mjs › (Lesson 5's seven tests, now over the larger board)
    ✓ 17 states.spec.mjs › every primitive shows five distinct states, in both themes
    ✓ 18 states.spec.mjs › a pinned state looks exactly like the real one
    ✓ 19 states.spec.mjs › disabled is visible at a glance, not only in the DOM
    ✓ 20 states.spec.mjs › a disabled style switched off is caught, though the DOM still says disabled
    ✓ 21 states.spec.mjs › the Build status Refresh button is really disabled while it fetches
    21 passed

Two of these need explaining:

- **Test 18** hovers the live control with the real mouse, reaches it with
  the Tab key, and holds the mouse button down on it. Each time, it compares
  the computed look with the pinned column, and they must be identical.
- **Test 19** screenshots each Default and Disabled specimen in both themes.
  It requires at least half of the control's colour to move. It compares
  colour histograms rather than pixels by position, because the two table
  cells sit at different sub-pixel offsets, and anti-aliasing alone moves
  10-15% of pixels. Measured on this code:
  - real disabled: 0.92 to 0.97;
  - disabled styling switched off: 0.035 to 0.049.

Tests 9, 15 and 20 edit a file through a `try-` script and always restore it
in a `finally` block. Tests run one at a time (`workers: 1`) for that reason.
