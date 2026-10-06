# Lesson 5: Layout, grid, and spacing rhythm

Code for Lesson 5 of *Frontend Engineering & Design at Scale*. The companion
article is `lesson-05-article.md`, and the diagrams are
`lesson-05-design-diagram.svg` and `lesson-05-flow-diagram.svg`. All three sit
beside this zip.

## What this lesson adds

- **A spacing scale** in `packages/design-system/src/tokens/spacing.js`. It has
  an 8px base unit and the steps `space-1, 2, 3, 4, 6, 8` (8, 16, 24, 32, 48
  and 64px). It also defines three layout roles, `gutter`, `page-margin` and
  `panel-padding`, each pointing at one step on wide screens and another on
  narrow ones.
- **Generated `spacing.css`**, written by `pnpm tokens`. It contains:
  - every step as `--pulse-space-N`;
  - every role as `--pulse-layout-<role>`;
  - the 12-column `.pulse-grid`, with `.pulse-span-1` to `.pulse-span-12`;
  - `.pulse-stack-N` and `.pulse-cluster-N` layout primitives.

  `pnpm lint` fails if the file is stale.
- **A spacing reset** in `base.css`. Browsers add margins and padding nobody
  wrote: an `h2` gets 0.83em and a `fieldset` gets 0.35em 0.75em. Those land
  off the grid, so the reset zeroes them.
- **The Control Tower rebuilt on the grid.** The Spacing panel spans 5 columns,
  Build status 7, Ownership 5, Type scale 7 and Contrast audit 12. Below 960px
  every panel spans the full width.
- **The spacing overlay**, in `spacing-audit.js` and `spacing-overlay.js`. It
  reads every padding and margin from computed styles, and measures every gap
  between neighbouring items of a flex or grid container from their real boxes.
  It then draws each one as a labelled region, along with the 12 column
  guides. Anything off the 8px grid turns red. The toggle sits in the top bar
  of both apps and its state survives a reload.
- **A Spacing panel** in the Control Tower. It shows:
  - each step drawn at its real width and measured back;
  - the board's columns, gutter, page margin and panel padding, read from
    the page;
  - the overlay's counts and its off-grid list.
- **`pulse/no-raw-spacing`**, an ESLint rule for CSS and JS. It flags any
  margin, padding or gap that isn't `0`, `auto`, a scale token or a layout
  role.
- **`pnpm try-off-grid`**, which switches the reset off so the browser's
  default margins come back. `pnpm lint` stays green, because nobody typed
  those values; the overlay turns them red. `pnpm try-off-grid --restore`
  switches the reset back on.

## Prior state, and what is carried forward

No Lesson 4 zip was available when this lesson was generated. I read the code
recorded in the Lesson 4 conversation and rebuilt the earlier lessons from it.
The paths, port, package names, token values and lint rule behaviour are the
same, but the files are not byte-for-byte the Lesson 4 zip. Specifically:

- the 8-package Turborepo monorepo, with CODEOWNERS and the boundary check
  (Lessons 0-2);
- the Control Tower's dev server and live event stream, the Build status
  panel (which reads turbo's own `--summarize` and `--dry=json` output) and
  the Ownership graph (which reads CODEOWNERS) (Lesson 2);
- the type scale and `pulse/no-raw-font-size`, plus a Type scale panel
  (Lesson 3);
- the colour roles, the contrast gate, the Light / Dark / System switch,
  `pulse/no-raw-color`, the Contrast audit panel and `pnpm try-broken-pair`
  (Lesson 4);
- the billing invoice list at `/billing/invoices/`, now also on the spacing
  scale.

## Quick start

    pnpm install
    pnpm build
    pnpm dev    # http://localhost:4100/ and http://localhost:4100/billing/invoices/

See BUILD.md, RUN.md, TEST.md and VERIFY.md.
