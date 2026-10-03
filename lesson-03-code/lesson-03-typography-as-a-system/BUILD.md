# Build

Requires Node 22 (tested on 22.22) and pnpm 9 (`corepack enable` gives you the
pinned 9.15.9).

    pnpm install
    pnpm build

Expected (first build on a clean checkout), last lines:

     Tasks:    8 successful, 8 total
    Cached:    0 cached, 8 total

Run `pnpm build` again with no changes and every package comes from cache:

     Tasks:    8 successful, 8 total
    Cached:    8 cached, 8 total
      Time:    ...  >>> FULL TURBO

Lint and typecheck:

    pnpm lint

ends with

    OK: all 8 packages (...) have CODEOWNERS coverage.
    OK: typography.css matches tokens/typography.js.

    pnpm typecheck

prints `Lesson 3 ships plain ESM (no TS surface yet) — typecheck is a no-op until Lesson 10`
and exits 0. There is no TypeScript in the repo until Lesson 10.

If you change `packages/design-system/src/tokens/typography.js`, regenerate
the CSS with `pnpm tokens` before `pnpm lint`.
