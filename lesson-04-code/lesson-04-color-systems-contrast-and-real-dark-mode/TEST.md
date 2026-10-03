# Test

## Unit tests

    pnpm test

runs each package's build-and-import smoke test through turbo, then Vitest:

     Tasks:    16 successful, 16 total
    ...
     Test Files  7 passed (7)
          Tests  47 passed (47)

| File | What it proves |
| --- | --- |
| `tests/contrast.test.mjs` | The WCAG maths: 21:1 and 1:1 extremes, #767676 passes and #777777 fails on white, ratios never round up, rgb() parsing. |
| `tests/colors.test.mjs` | Every role has a real palette value in both themes, all 28 checks pass, and the light-grey-in-dark mistake fails exactly the three dark `text-muted` pairs. |
| `tests/generated-css.test.mjs` | `colors.css` and `typography.css` are exactly what the token files generate. |
| `tests/theme.test.mjs` | Light/Dark/System resolution, persistence, following the OS only on System, following another tab, blocked storage. |
| `tests/lint-rules.test.mjs` | `pulse/no-raw-color` on CSS and JS (hex, colour functions, named colours, var() fallbacks, custom properties) and the carried-forward `pulse/no-raw-font-size`. |
| `tests/no-raw-hex.test.mjs` | The review's grep, as a test: the only hex colour outside the token folder is the brand mark. |
| `tests/billing.test.mjs` | Invoice filtering, sorting, totals, and every status tone mapping to real colour roles. |

## Browser tests

    pnpm exec playwright install chromium   # once per machine
    pnpm test:e2e

starts the dev server itself and runs 8 tests in real Chromium:

    8 passed

They check that the switch re-themes the tower (painted colours compared with
the token values), that one choice themes both apps live across tabs, that
System follows an emulated OS setting, that the switch works with arrow keys,
that the audit shows 28 of 28 measured passes, and that `try-broken-pair`
makes three dark cells fail visibly and `pnpm lint`'s gate exit 1, then
recovers. Two more tests check the Lesson 2 and 3 panels still work.

If you already have `pnpm dev` running, Playwright reuses it.
