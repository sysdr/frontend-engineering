# Test — Lesson 2

## Unit and integration

```bash
pnpm test
```

**1. `turbo run test`**: each package's `node --test` against its built
`dist/`, including `apps/control-tower/test/graph.test.js` (5 tests on the
shipped `dist/lib/graph.js`). Ends with:

```
 Tasks:    16 successful, 16 total
```

**2. `vitest run`**:

```
 ✓ tests/control-tower-dom.test.mjs (8 tests)
 ✓ tests/control-tower-data.test.mjs (10 tests)
 ✓ tests/boundary-rule.test.mjs (14 tests)
 ✓ tests/build-package.test.mjs (5 tests)
 ✓ tests/pr-template.test.mjs (7 tests)
 ✓ tests/codeowners.test.mjs (5 tests)
 ✓ tests/remote-cache.test.mjs (4 tests)

 Test Files  7 passed (7)
      Tests  53 passed (53)
```

What the new suites prove:

- `control-tower-data.test.mjs` runs the real `turbo run build --dry=json`
  and reads the real CODEOWNERS: 8 packages, each node's owners equal the
  CODEOWNERS line for its folder, four teams indexed, selecting billing
  lights billing-team, violation imports resolve to the right package, and a
  real remote-cache run reads as 8/8 REMOTE.
- `control-tower-dom.test.mjs` (jsdom) mounts both panels into the real
  `index.html` from a snapshot captured from this repo, then clicks: strips
  match the run, picking an older run recolours them, clicking billing lights
  only `billing-team`, Enter selects a node, a team chip lights its 5
  packages, links are spread across cards, a violation becomes a dashed link.

## End to end (real browser)

```bash
pnpm exec playwright install chromium   # once per machine
pnpm test:e2e
```

Starts the Control Tower on port 4173 and runs:

```
  ✓  1 e2e/control-tower.spec.mjs:22:1 › a build updates the board live, with turbo's real hit/miss per package
  ✓  2 e2e/control-tower.spec.mjs:50:1 › clicking a node in the ownership graph highlights its CODEOWNERS team
  ✓  3 e2e/control-tower.spec.mjs:63:1 › keyboard alone can select a package
  ✓  4 e2e/control-tower.spec.mjs:70:1 › on a phone-width screen the page never scrolls sideways

  4 passed
```

Test 1 edits `apps/billing/src/index.js`, runs a real build, compares every
strip against the newest file in `.turbo/runs/`, and restores the file in a
`finally` block. Screenshots land in `test-results/`.

## Proving the tests are not vacuous

Give billing a different owner in `.github/CODEOWNERS` (change
`@pulse/billing-team` on the `apps/billing/` line to `@pulse/payments-team`), then:

```bash
pnpm exec vitest run tests/control-tower-data.test.mjs
```

```
   × ownership > indexes the four CODEOWNERS teams with what each must approve
   × ownership > clicking billing lights billing-team and the shared packages it co-owns
      Tests  2 failed | 8 passed (10)
```

Put the line back and the same command shows `Tests  10 passed (10)`.
