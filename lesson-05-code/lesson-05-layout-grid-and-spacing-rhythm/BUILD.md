# Build

You need Node 22 (tested on 22.22.2) and pnpm 9. Running `corepack enable`
gives you the pinned 9.15.9.

    pnpm install
    pnpm build

On a clean checkout, the first build ends with:

     Tasks:    8 successful, 8 total
    Cached:    0 cached, 8 total

Run `pnpm build` again with no changes and every package comes from cache:

     Tasks:    8 successful, 8 total
    Cached:    8 cached, 8 total
      Time:    ...  >>> FULL TURBO

Each build writes a run summary to `.turbo/runs/`. The Control Tower's Build
status panel reads it.

## Lint

    pnpm lint

This runs, in order:

1. CODEOWNERS coverage;
2. import boundaries;
3. the generated-CSS check;
4. ESLint, including `pulse/no-raw-spacing`, `pulse/no-raw-color` and
   `pulse/no-raw-font-size`;
5. the contrast gate.

Expected output:

    OK: all 8 packages have CODEOWNERS coverage.
    OK: import boundaries hold across 8 packages.
    OK: typography.css, colors.css and spacing.css match their token files.
    OK: all 28 contrast checks pass WCAG AA (14 pairs x light and dark).

ESLint prints nothing when everything is clean.

## Typecheck

    pnpm typecheck

This runs `tsc` with `checkJs` over the design system and billing's data
module, using their JSDoc types. That covers the new `spacing.js`,
`spacing-audit.js` and `spacing-overlay.js`. It prints only the command and
exits 0.

## Regenerating token CSS

After editing `tokens/spacing.js`, `tokens/colors.js` or
`tokens/typography.js` by hand, run:

    pnpm tokens

It prints `Wrote typography.css, colors.css and spacing.css.` The dev server
does this for you while it is running.
