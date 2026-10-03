# Verify — Lesson 4 proof criteria

This file matches the article's "The proof" section, command for command.

**1. Everything builds and the gate is green.**

    pnpm install
    pnpm build
    pnpm lint

The last line of `pnpm lint` reads `OK: all 28 contrast checks pass WCAG AA (14 pairs x light and dark).`

**2. Open both apps.**

    pnpm dev

Open http://localhost:4100 and, in a second tab, http://localhost:4100/billing/invoices/. The Contrast audit panel reads **28 of 28 pass** and shows a green **Gate passing** badge. Every row has a green Pass in both the Light and the Dark column.

**3. Flip the theme: every surface changes, no component code does.**

In the Control Tower, click **Dark**. The page, every panel, the cards, badges and ownership graph turn dark at once. Switch to the invoice tab without reloading: it is already dark. Click **Light** there and the Control Tower tab follows. The Pulse mark in the top-left corner stays the same in both themes. Click **System** and the switch says "Following your system: light" or "dark", matching your OS.

**4. Prove no component holds a colour value.**

    grep -rnE '#[0-9a-fA-F]{3,8}\b' apps packages --include='*.js' --include='*.css' --include='*.html' --include='*.svg' | grep -v '/tokens/' | grep -v node_modules | grep -v /dist/

You see exactly two lines, both in `apps/control-tower/src/brand/pulse-mark.svg`: the brand mark, the one never-themed exception.

**5. Break a dark-mode pairing on purpose and watch the gate catch it.**

Leave the Control Tower open, then run:

    pnpm try-broken-pair
    pnpm lint

The script makes the dark theme's `text-muted` reuse the light theme's grey (`slate-600`). Within a second, without a reload, the panel reads **25 of 28 pass** and a red **Gate failing** badge appears. The Dark cells of the three `text-muted` rows turn red at 2.54:1, 2.34:1 and 2.13:1, while their Light cells stay green. `pnpm lint` exits 1 and ends with:

    FAIL: dark: text-muted on surface is 2.54:1, needs 4.5:1 (Captions on the page)
    FAIL: dark: text-muted on surface-raised is 2.34:1, needs 4.5:1 (Captions in panels)
    FAIL: dark: text-muted on surface-sunken is 2.13:1, needs 4.5:1 (Muted table headers)
    3 of 28 contrast checks fail WCAG AA.

**6. Put it back.**

    pnpm try-broken-pair --restore
    pnpm lint

The panel returns to **28 of 28 pass** and `pnpm lint` ends with `OK: all 28 contrast checks pass WCAG AA (14 pairs x light and dark).`

**7. The same proof, automated.**

    pnpm test
    pnpm exec playwright install chromium   # once per machine
    pnpm test:e2e

You see `Tests  47 passed (47)` and then `8 passed`.
