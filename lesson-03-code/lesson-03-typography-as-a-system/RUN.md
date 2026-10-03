# Run

    pnpm build      # once, so turbo has a run for the build board
    pnpm dev

The terminal prints `Pulse Control Tower: http://localhost:4100`.
(Set `PORT=...` to use another port.)

## What you should see

**http://localhost:4100** — the Control Tower. Below the Lesson 2 build board
and ownership graph is the **Type scale** panel:

- seven rows, display at the top down to caption, each set in its own role;
- Token and Rendered columns that agree (48.83px … 12.8px), line heights
  64px … 20px, and "Matches" in green on every row;
- a blue staircase of seven bars rising left to right, with a dashed 12px floor;
- a green line: "No hand-typed font sizes in 23 JS and CSS files."

Pick **1.5 Perfect fifth** in "Compare ratio": dashed ghost bars appear beside
each step, the smallest one amber because it falls under 12px, and the
sentence reads "At 1.5, caption would be 10.67px, under the 12px floor, and
display 121.5px."

**http://localhost:4100/billing/invoices/** (or the link in the panel) — the
invoice list: headline, three totals (Outstanding $80,789.95, Overdue
$31,694.95, Collected $80,583.00), 18 invoices, filter buttons with counts and
sortable Invoice / Due / Amount columns. Press **Show type roles**: every text
element is outlined in its role's colour and a card reads "154 text elements
measured. All 154 sit on a type-scale step."

## Watch it react

Leave `pnpm dev` running and add a hand-typed size:

    echo '.invoices td { font-size: 15px; }' >> apps/billing/src/invoices/invoices.css

Within a couple of seconds the panel's lint line turns amber: "1 hand-typed font size.
pnpm lint will fail." with `apps/billing/src/invoices/invoices.css:103`.
Reload the invoice page and press Show type roles: table cells get dashed red
outlines. Remove the line (delete it in your editor) and the panel goes green.
