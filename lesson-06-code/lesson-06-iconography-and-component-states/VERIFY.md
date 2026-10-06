# Verify: Lesson 6's proof, step by step

This matches the article's "The proof" section command for command. Run
everything from the repo root.

## 1. Build

    pnpm install
    pnpm build

The build ends with `Tasks:    8 successful, 8 total`.

## 2. Read the icons' source

Every icon shares one stroke width and one corner radius. You can check it
from the files themselves:

    grep -ho 'stroke-width="[^"]*"' packages/design-system/src/icons/*.svg | sort | uniq -c
    grep -ho ' rx="[^"]*"' packages/design-system/src/icons/*.svg | sort | uniq -c

Expected:

         10 stroke-width="2"
          2  rx="2"

Ten files, one stroke width. The two rectangles (monitor and grid) share one
radius. Then run:

    pnpm lint

The fourth line reads:

    OK: all 10 icons share one grid (24x24, stroke 2, round caps and joins, corner radius 2, points inside 2-22), all in use, 10 of 15 budget.

## 3. Open the Control Tower

    pnpm dev

Open http://localhost:4100/ in a window about 1440px wide.

- **Icons** reads "10 of 10 on the grid", and every tile says "On grid".
- Click **refresh**. Its source appears with `stroke-width="2"` marked green.

## 4. Look at the five states

**State gallery** reads "3 of 3 rows distinct", and each row reads
"5 distinct states". Then try each state on the live column:

- Move the mouse over the live **Rebuild** in Try it. It matches the Hover
  column.
- Tab to it. It matches Focus.
- Press and hold. It matches Active.

Compare Default with Disabled. Disabled is grey, muted and dashed, even in
greyscale. Switch to **Dark**: every row still reads "5 distinct states".

## 5. Break an icon on purpose

    pnpm try-odd-icon
    pnpm lint

Lint fails with:

    FAIL: packages/design-system/src/icons/refresh.svg: stroke-width is "1.5"; the grid says "2"

Reload the Control Tower:

- Icons reads "1 off the grid".
- The refresh tile says "Off grid".
- Its source shows `stroke-width="1.5"` marked red.
- Build status's Refresh icon is visibly thinner.

Put it back with:

    pnpm try-odd-icon --restore

## 6. Make disabled invisible on purpose

    pnpm try-flat-disabled

Reload. Every row header now reads **"Disabled looks like Default"**, and the
panel reads "3 of 3 rows have look-alike states". The Disabled column looks
exactly like Default. Click a disabled button: nothing happens, because the
DOM still says disabled.

Now run `pnpm lint`. It passes, because nobody typed a wrong value; the
problem only shows when the states are compared.

The automated version screenshots Default and Disabled in both themes:

    pnpm try-flat-disabled --restore
    pnpm exec playwright test -g "at a glance"

Expected: `1 passed`.

## 7. Full suites

    pnpm test        # Tests  88 passed (88)
    pnpm test:e2e    # 21 passed
