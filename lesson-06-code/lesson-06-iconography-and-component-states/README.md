# Lesson 6: Iconography and component states

Code for Lesson 6 of *Frontend Engineering & Design at Scale*. The article is
`lesson-06-article.md`, and the diagrams are `lesson-06-design-diagram.svg` and
`lesson-06-flow-diagram.svg`. All three sit beside this zip.

## What this lesson adds

- **A hand-built icon set** of ten standalone SVGs in
  `packages/design-system/src/icons/`: check, alert, cross, sun, moon,
  monitor, grid, package, refresh and users. Every file shares one grid:
  - a 24 × 24 viewBox;
  - a 2-unit stroke with round caps and joins;
  - a 2-unit corner radius on rectangles;
  - every point inside the 2–22 live area.
- **`icons/convention.js`**, which writes that grid down once, and
  `checkIcon()`, which reads an `.svg` file's text and lists every way it
  leaves the grid. The same function runs in `pnpm lint` and in the browser.
- **Generated `icons/icons.js`**, written by `pnpm tokens` from the `.svg`
  files, and **`createIcon(name)`**, which renders from it. `pnpm lint`
  fails if `icons.js` is stale.
- **`scripts/check-icons.mjs`**, a new `pnpm lint` step. It fails on:
  - an icon off the grid;
  - an icon no code uses;
  - a set larger than the 15-icon budget.
- **`createButton` and `createFormField`**, with five designed states each:
  default, hover, focus, active and disabled. Both live in
  `components/components.css`. Each state is one rule listing the real
  pseudo-class and the `[data-state]` the gallery pins, so the two can't
  drift. Disabled uses three cues: a grey fill, muted ink and a dashed edge.
- **Two new colour roles**, `accent-pressed` and `surface-pressed`, plus four
  new contrast pairs. The gate now checks 18 pairs in two themes, 36 checks.
- **Icons used throughout:**
  - the overlay toggle (now a `createButton`);
  - the Light / Dark / System switch;
  - every status badge, so pass and fail differ in shape, not only colour;
  - the build cards;
  - the invoice list.
- **The State gallery panel.** Button (primary and secondary) and FormField
  appear in all five states side by side, plus a live column to try. Each
  row checks its five states really look different.
- **The Icons panel.** Each icon appears at 4× on its keyline grid, checked
  from its own `.svg` file. Pick one to read its source, with the grid
  attributes marked.
- **A real disabled state in use:** Build status gets a Refresh button that
  disables itself while it fetches.
- **Two break-it demos:**
  - `pnpm try-odd-icon` gives refresh.svg a 1.5 stroke. Lint fails, and the
    panel turns red.
  - `pnpm try-flat-disabled` makes disabled look like default. Lint stays
    green; the gallery catches it.

## Prior state, and what is carried forward

No Lesson 5 zip was available when this lesson was generated. I read the code
recorded in the Lesson 5 conversation and rebuilt it from that record, so the
paths, port, package names, token values and lint behaviour match it, but the
files are not byte-for-byte the Lesson 5 zip. Carried forward:

- the 8-package Turborepo monorepo, CODEOWNERS and the boundary check
  (Lessons 0-2);
- the Control Tower's dev server, live event stream, Build status and
  Ownership panels (Lesson 2);
- the type scale and its lint rule (Lesson 3);
- colour roles, the contrast gate and the theme switch (Lesson 4);
- the spacing scale, 12-column board, spacing overlay and its lint rule
  (Lesson 5);
- the billing invoice list at `/billing/invoices/`.

`createButton` and `createFormField` did not exist in the Lesson 0-5 code. The
curriculum calls them "from earlier lessons" because they come from the older
Hyperscale edition. This lesson builds them, keeping that edition's API: a
required label, a real label/for pair, and hint and error text wired through
`aria-describedby`.

## Quick start

    pnpm install
    pnpm build
    pnpm dev    # http://localhost:4100/ and http://localhost:4100/billing/invoices/

See BUILD.md, RUN.md, TEST.md and VERIFY.md.
