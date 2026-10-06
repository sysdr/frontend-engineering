# Run

    pnpm build   # gives the Build status panel a run to show
    pnpm dev

The server prints:

    Control Tower: http://localhost:4100/
    Invoice list:  http://localhost:4100/billing/invoices/

If port 4100 is taken, run `PORT=4200 pnpm dev`.

## What you should see

**http://localhost:4100/** shows the Control Tower. The top bar has a
**Spacing overlay** button with the grid icon. The Light / Dark / System
switch shows a sun, a moon and a monitor.

**State gallery** (full width, first on the board):

- Three rows: Button primary ("Rebuild", refresh icon), Button secondary
  ("Spacing overlay", grid icon) and FormField ("Invoice amount (USD)").
- Five columns: Default, Hover, Focus, Active and Disabled.
  - Hover is one step deeper.
  - Focus adds a 3px ring.
  - Active is two steps deeper, and a button sinks 1px.
  - Disabled has a grey fill, muted text and a **dashed** edge.
- Each row header reads "5 distinct states". The panel badge reads
  "3 of 3 rows distinct".
- The last column, **Try it**, is live. Hover it, Tab to it, or press and
  hold it, and it looks exactly like the pinned column above. Releasing a
  button writes "Pressed the live ... Button." under the table.
- Switch to Dark: the colours change, and every row still reads
  "5 distinct states".

**Icons** (full width):

- Ten tiles, each at 4× on a faint 24-unit grid, with the 2-unit live area
  dashed. Each tile shows "On grid", and the panel badge reads
  "10 of 10 on the grid".
- Below the tiles, the grid facts: canvas 24 × 24, stroke 2, round caps and
  joins, corner radius 2, live area 2 to 22, budget 10 of 15.
- Click a tile to see its file's path and source. Each grid attribute
  (`viewBox`, `stroke-width`, caps, joins, `rx`) is marked green.

**The rest of the board**, carried forward:

- **Spacing:** reads "All N on the 8px grid". The new panels sit on the grid
  too.
- **Build status:** each card shows a package icon and a team icon. The
  **Refresh** button turns dashed and grey while it fetches.
- **Ownership** and **Type scale:** unchanged.
- **Contrast audit:** reads "36 of 36 pass" and "Gate passing". Every badge
  carries a check, alert or cross icon.

**http://localhost:4100/billing/invoices/** shows the invoice list. The
badges read Paid (check), Due soon (alert) and Overdue (cross).
