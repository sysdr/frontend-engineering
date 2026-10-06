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
3. the generated-file check, which covers the three token stylesheets and,
   new in this lesson, `icons/icons.js`;
4. the icon check (new): every icon on the grid, every icon in use, the set
   inside its budget;
5. ESLint, including `pulse/no-raw-spacing`, `pulse/no-raw-color` and
   `pulse/no-raw-font-size`;
6. the contrast gate.

Expected output:

    OK: all 8 packages have CODEOWNERS coverage.
    OK: import boundaries hold across 8 packages.
    OK: typography.css, colors.css, spacing.css and icons.js match their sources.
    OK: all 10 icons share one grid (24x24, stroke 2, round caps and joins, corner radius 2, points inside 2-22), all in use, 10 of 15 budget.
    OK: all 36 contrast checks pass WCAG AA (18 pairs x light and dark).

ESLint prints nothing when everything is clean.

## Typecheck

    pnpm typecheck

This runs `tsc` with `checkJs` over the design system, using its JSDoc
types. That covers the new icon, state, button, field and badge modules. It
prints only the command and exits 0.

## Regenerating

After editing a token file or an icon's `.svg` by hand, run:

    pnpm tokens

It prints `Wrote typography.css, colors.css, spacing.css and icons.js.` The dev
server does this for you while it is running.
