# Run

    pnpm build   # gives the Build status panel a run to show
    pnpm dev

The server prints:

    Control Tower: http://localhost:4100/
    Invoice list:  http://localhost:4100/billing/invoices/

If port 4100 is taken, run `PORT=4200 pnpm dev`.

## What you should see

**http://localhost:4100/**: the Control Tower, laid out on a 12-column grid.

- **Top bar**: the brand, a link to the invoice list, a **Spacing overlay**
  button and the Light / Dark / System switch.
- **Spacing** (5 columns wide):
  - The header badge reads "All N on the 8px grid". N is about 1,000 in a
    1440px-wide window; it changes with window width.
  - A table of the six steps, each bar drawn at its real width with a tick
    every 8px, measured back as 8px, 16px, 24px, 32px, 48px and 64px, each
    marked "Matches".
  - Four facts read from the page: Columns 12, Gutter 24px, Page margin 32px,
    Panel padding 24px. Below 960px wide these become 16px, 16px and 16px.
  - The audit counts, and a legend of the overlay's colours.
- **Build status** (7 columns): one card per package, showing its team, a
  cache-hit or cache-miss badge and its duration. Run `pnpm build` in another
  terminal and the cards update.
- **Ownership** (5 columns): click a node, or Tab to it and press Enter, to
  highlight everything its team owns.
- **Type scale** (7 columns): seven roles, each measured as rendered and
  marked "Matches".
- **Contrast audit** (12 columns): 14 pairs in both themes. The header reads
  "28 of 28 pass" and "Gate passing".

**Click Spacing overlay.** The button turns blue and the overlay appears:

- faint dashed column guides for the board's 12 columns;
- a green tint over every padding;
- amber hatching over every margin;
- blue hatching over every gap;
- a small label on each, showing its value in pixels.

Every label reads a multiple of 8: 8, 16, 24 or 32 at 1440px wide. Nothing is red. Nothing on the page
moves, either when you turn the overlay on or when you turn it off. Scroll,
and the overlay stays pinned to its elements. Reload, and it is still on.

**http://localhost:4100/billing/invoices/**: the invoice list, with the same
top bar. Its overlay shows the same rhythm: 32px page margin, 24px sheet
padding, and 8px and 16px table-cell padding.
