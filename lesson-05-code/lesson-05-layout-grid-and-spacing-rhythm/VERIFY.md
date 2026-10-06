# Verify: Lesson 5's proof, step by step

This matches the article's "The proof" section command for command.
Run everything from the repo root.

## 1. Build

    pnpm install
    pnpm build

The build ends with `Tasks:    8 successful, 8 total`.

## 2. Open the Control Tower

    pnpm dev

Open http://localhost:4100/ in a window about 1440px wide. In the **Spacing**
panel:

- the badge reads **"All N on the 8px grid"**, where N is about 1,000;
- every one of the six scale rows says **Matches**;
- the four facts read **12**, **24px**, **32px** and **24px**.

## 3. Turn on the overlay

Click **Spacing overlay** in the top bar. You should see:

- the 12 board columns as faint dashed guides;
- green over paddings, amber hatching over margins, blue hatching over gaps,
  each with a label;
- every label reading a multiple of 8 (at this width: 8, 16, 24 or 32);
- nothing red.

## 4. Prove the overlay is not load-bearing

Toggle the overlay off and on while watching any panel edge. Nothing moves.
The automated version compares the box of every element on the page with the
overlay off, then on, then off again:

    pnpm exec playwright test -g "moves nothing"

Expected: `1 passed`. (Stop `pnpm dev` first only if you changed its port to 4199.)

## 5. Watch the overlay catch what lint cannot

    pnpm try-off-grid

This prints `Spacing reset switched off: browser default margins are back. ...`.
Reload the Control Tower. Then:

- The Spacing badge reads **"78 off the grid"** at 1440px wide. The exact
  count changes with window width; it is always more than zero.
- With the overlay on, every panel title carries a red **16.6** label. That
  is the browser's default `h2` margin: 0.83em of 20px.

Now run:

    pnpm lint

All four `OK:` lines still print and the exit code is 0. Nobody typed 16.6px,
so the lint rule has nothing to catch. Put the reset back:

    pnpm try-off-grid --restore

Reload, and the badge reads "All N on the 8px grid" again.

## 6. Watch lint catch a value someone typed

In `apps/control-tower/src/styles.css`, change line 9, inside `.topbar`, from
`gap: var(--pulse-space-3);` to `gap: 20px;`. Then run:

    pnpm lint

It fails with:

    apps/control-tower/src/styles.css
      9:3  error  gap: 20px is not on the spacing scale. Use var(--pulse-space-N) or var(--pulse-layout-<role>)  pulse/no-raw-spacing

Change the line back.

## 7. Full suites

    pnpm test        # Tests  54 passed (54)
    pnpm test:e2e    # 12 passed
