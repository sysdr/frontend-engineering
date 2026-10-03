# Run

    pnpm build   # so the Build status panel has a run to show
    pnpm dev

prints

    Control Tower: http://localhost:4100/
    Invoice list:  http://localhost:4100/billing/invoices/

Set `PORT=4200 pnpm dev` if 4100 is taken.

## What you should see

**http://localhost:4100/** — the Control Tower.

- Top right: a Light / Dark / System switch. On first visit it is on System
  and says "Following your system: light" (or dark).
- **Build status**: eight package cards, each with its owning team, a cache
  badge (green "Cache hit", amber "Cache miss") and its duration from the last
  `pnpm build`. Run `pnpm build` in another terminal and the cards update.
- **Ownership**: apps on the left, shared packages on the right, edges are
  real dependencies. Click a node (or Tab to it and press Enter) to highlight
  everything its team owns.
- **Contrast audit**: 14 rows, each showing an "Aa" sample (or a border sample
  for UI parts) in a light box and a dark box, the measured ratio, and
  Pass/Fail. The header reads "28 of 28 pass" and "Gate passing".
- **Type scale**: seven roles, each measured as rendered, all "Matches".

**http://localhost:4100/billing/invoices/** — 18 invoices with totals, a status
filter, sortable columns and coloured status badges.

## Try it

- Click **Dark**. Every panel, the page, the badges and the graph change at
  once. The Pulse mark in the corner does not: it is the brand exception.
- With the invoice list open in a second tab, switch theme in the Control
  Tower. The invoice tab follows without a reload.
- Click **System**, then change your OS appearance. The page follows.
- Run `pnpm try-broken-pair`. Within a second the Contrast audit turns three
  dark cells red, the count reads "25 of 28 pass", and the gate lists the three
  failing pairs. Notice the panel's own grey captions become hard to read in
  dark mode — the failure is visible on the page, not only in the table.
  Run `pnpm try-broken-pair --restore` and it returns to 28 of 28.
