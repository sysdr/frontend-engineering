# Verify — Lesson 2's proof

Matches the article's "The proof" section, step for step. The curriculum's
proof: running `pnpm build` updates the dashboard's cards in real time with
the correct hit/miss per package, and clicking a node in the ownership graph
highlights its real CODEOWNERS team. Every expected output below was
recorded from a fresh unzip of this lesson's zip. Use two terminals in this
folder.

## 1. Install and build twice

```bash
pnpm install
pnpm build
pnpm build
```

First build: `Cached:    0 cached, 8 total`. Second: `Cached:    8 cached, 8 total` and `>>> FULL TURBO`.

## 2. Open the Control Tower

Terminal A:

```bash
pnpm dev
```

Expect `Pulse Control Tower: http://localhost:4100`. Open it in a browser and check:

- the badge at the top right reads `Live, watching turbo`
- the build board shows two bars, `0/8` (amber) and `8/8` (green)
- the sentence reads `8 of 8 packages came from cache, nothing rebuilt.` followed by the time
- all eight strips are green and read `Cached here`

Leave the page open. Do not reload it for the rest of this walkthrough.

## 3. Build, and watch the cards change by themselves

Terminal B:

```bash
echo '// touched in VERIFY step 3' >> apps/billing/src/index.js
pnpm build
```

Terminal B ends with `Cached:    7 cached, 8 total`. In the browser, about a
second later and with no reload:

- a third bar `7/8` appears and is selected
- the sentence reads `7 of 8 packages came from cache, 1 rebuilt.`
- the **billing** strip turns amber and reads `Rebuilt` with its build time;
  the other seven stay green with `Cached here`
- every strip briefly gets a coloured outline, showing which run just landed
- in the graph, billing's pill reads `Rebuilt`

Terminal A logs `[control-tower] pushed to 1 viewer(s): turbo wrote <run-id>.json`.
To check the board against the terminal's own source of truth, open that
`.turbo/runs/<run-id>.json` file: billing's `cache.status` is `MISS`, every
other build task's is `HIT`.

## 4. Click a node, see its CODEOWNERS team

In the graph, click **billing** (or Tab to it and press Enter):

- the `billing-team` chip turns purple; the other three chips stay plain
- billing gets a dark outline; `design-system`, `config` and `contracts` are
  highlighted (billing-team co-owns them in CODEOWNERS); `admin`,
  `analytics`, `shell` and `control-tower` fade
- the text below reads `Approvals needed from billing-team.` and
  `A change here rebuilds 1 of 8 packages.`

Now click the **platform-team** chip. Exactly five nodes light up: `shell`,
`control-tower`, `config`, `contracts`, `design-system`, the same five lines
CODEOWNERS gives `@pulse/platform-team`.

## 5. A boundary violation shows up as a link

Terminal B:

```bash
echo 'import { renderInvoiceLine } from "@pulse/billing";' >> apps/analytics/src/index.js
```

Within a second, without a reload, a dashed amber arrow runs from
**analytics** to **billing**, and the text under the graph reads
`1 boundary violation, drawn as dashed links. pnpm lint will fail.` with
`apps/analytics/src/index.js:10`. The terminal agrees:

```bash
pnpm lint
```

exits 1 with:

```
@pulse/analytics:lint:   10:1  error  apps/analytics is an app and may not import another app (apps/billing). Put the shared piece in packages/* and depend on that  pulse/no-cross-boundary-import
```

## 6. Undo both edits

Delete the last line you added to `apps/analytics/src/index.js` and to
`apps/billing/src/index.js` (in your editor). The arrow disappears and the
text reads `No boundary violations. Every import respects the Lesson 1 rule.`

## 7. Automated

```bash
pnpm test
```

Expect `Tasks:    16 successful, 16 total`, then `Test Files  7 passed (7)` and `Tests  53 passed (53)`.

```bash
pnpm exec playwright install chromium   # once per machine
pnpm test:e2e
```

Expect `4 passed`. Test 1 repeats step 3 automatically and compares every
strip with the newest run summary; test 2 repeats step 4.

## Checklist

- [ ] `pnpm build` twice: 0/8, then 8/8 FULL TURBO
- [ ] browser: badge `Live, watching turbo`, two bars, eight green strips
- [ ] after editing billing and building: new `7/8` bar, billing `Rebuilt`, others `Cached here`, no reload
- [ ] clicking billing lights `billing-team` and only the packages it co-owns
- [ ] clicking platform-team lights exactly 5 nodes
- [ ] a bad import draws a dashed arrow analytics → billing; `pnpm lint` fails with the same message
- [ ] `pnpm test`: 53 tests; `pnpm test:e2e`: 4 passed
