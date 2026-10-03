# Build

Requires Node 22 (tested on 22.22.2) and pnpm 9 (`corepack enable` gives you
the pinned 9.15.9).

    pnpm install
    pnpm build

First build on a clean checkout ends with:

      Tasks:    8 successful, 8 total
     Cached:    0 cached, 8 total

Run `pnpm build` again with no changes:

      Tasks:    8 successful, 8 total
     Cached:    8 cached, 8 total
       Time:    ...  >>> FULL TURBO

Each build also writes a run summary to `.turbo/runs/`, which the Control
Tower's Build status panel reads.

## Lint

    pnpm lint

runs CODEOWNERS coverage, import boundaries, the generated-CSS check, ESLint
(including `pulse/no-raw-color` and `pulse/no-raw-font-size`) and the contrast
gate. Expected:

    OK: all 8 packages have CODEOWNERS coverage.
    OK: import boundaries hold across 8 packages.
    OK: typography.css and colors.css match their token files.
    OK: all 28 contrast checks pass WCAG AA (14 pairs x light and dark).

(ESLint prints nothing when clean.)

## Typecheck

    pnpm typecheck

runs `tsc` with `checkJs` over the design system and billing's data module
(JSDoc types). It prints only the command and exits 0.

## Regenerating token CSS

After editing `tokens/colors.js` or `tokens/typography.js` by hand:

    pnpm tokens

prints `Wrote typography.css and colors.css.` The dev server does this for you
while it is running.
