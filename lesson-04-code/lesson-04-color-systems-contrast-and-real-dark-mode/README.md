# Lesson 4 — Color systems, contrast, and real dark mode

Code for Lesson 4 of *Frontend Engineering & Design at Scale*. The companion
article is `lesson-04-article.md`; the diagrams are
`lesson-04-design-diagram.svg` and `lesson-04-flow-diagram.svg`.

## What this lesson adds

- **Semantic colour tokens** in `packages/design-system/src/tokens/colors.js`:
  a raw `palette`, 17 `roles` (surface, text, text-muted, accent, focus-ring,
  success/warning/danger …) with a light and a dark value each, and 14
  declared foreground/background `pairs` with the WCAG level each must meet.
- **Generated CSS** (`tokens/colors.css`): every role as
  `--pulse-color-<role>` under `[data-theme="light"]`, `[data-theme="dark"]`,
  and a `prefers-color-scheme` fallback for before JavaScript runs.
  `pnpm tokens` writes it; `pnpm lint` fails if it is stale.
- **WCAG contrast maths** (`tokens/contrast.js`), shared by Node and the
  browser, and the **contrast gate** (`scripts/check-contrast.mjs`, last step
  of `pnpm lint`): 14 pairs × 2 themes = 28 checks.
- **A theme controller** (`packages/design-system/src/theme.js`): Light / Dark /
  System, saved to `localStorage`, follows the OS while on System, and follows
  other tabs. Both apps mount the same switcher.
- **`pulse/no-raw-color`**, an ESLint rule for CSS and JS: no hex, `rgb()`,
  `hsl()`… or named colour outside the token folder.
- **Control Tower "Contrast audit" panel**: every pair drawn in both themes at
  once, measured from the rendered page, with the live gate result pushed over
  the server's event stream.
- **`pnpm try-broken-pair`**: makes the classic mistake on purpose (dark
  muted text reusing the light theme's grey) so you can watch the gate catch it.
  `pnpm try-broken-pair --restore` undoes it.

## Prior state, and what is carried forward

No Lesson 3 source tree was available when this lesson was generated. The
carried-forward code was **reconstructed** from the Lesson 2 and 3 records:
same paths, port, package names, type-scale values and lint rule behaviour,
but not byte-for-byte the earlier zips. Specifically:

- the monorepo (8 packages, Turborepo, CODEOWNERS, boundary check);
- the Control Tower's build board (reads turbo's own `--summarize` output) and
  ownership graph (reads CODEOWNERS);
- the type scale (`tokens/typography.js`, `pulse/no-raw-font-size`) and a
  compact Type scale panel that measures every role as rendered;
- the billing invoice list at `/billing/invoices/`.

Not carried forward from Lesson 3: the ratio picker, the "Show type roles"
page audit, and the live font-size lint line. Lesson 2 and 3's own test suites
are not included; this zip's tests cover Lesson 4 plus a check that each
carried-forward panel still works.

## Quick start

    pnpm install
    pnpm build
    pnpm dev    # http://localhost:4100 and http://localhost:4100/billing/invoices/

See BUILD.md, RUN.md, TEST.md and VERIFY.md.
