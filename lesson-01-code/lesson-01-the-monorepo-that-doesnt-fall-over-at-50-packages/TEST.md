# Test — Lesson 1

```bash
pnpm test
```

Two stages.

**1. `turbo run test`** — each package's own `node --test` against its built
`dist/` (so `test` depends on `build` in `turbo.json`). Ends with:

```
 Tasks:    14 successful, 14 total
```

(7 builds + 7 test tasks; how many are cached depends on what you ran before.)

**2. `vitest run`** — the root suites:

```
 ✓ tests/report.test.mjs (7 tests)
 ✓ tests/pr-template.test.mjs (7 tests)
 ✓ tests/boundary-rule.test.mjs (12 tests)
 ✓ tests/codeowners.test.mjs (5 tests)
 ✓ tests/build-package.test.mjs (4 tests)
 ✓ tests/remote-cache.test.mjs (4 tests)

 Test Files  6 passed (6)
      Tests  39 passed (39)
```

## What each suite proves

- `boundary-rule.test.mjs` — ESLint's own `RuleTester` runs the rule against
  real paths in this repo: 5 allowed imports pass; app→app (import, re-export,
  dynamic import), shared→app, an undeclared dependency and a `../../billing`
  escape each fail with the right message. Plus: the real repo has zero
  violations.
- `remote-cache.test.mjs` — the cache server rejects a missing token, reports
  itself enabled, misses → stores → serves identical bytes, and answers the
  batch query.
- `report.test.mjs` — runs the real `turbo run build --dry=json` and checks
  the inspector's graph: `contracts` changes rebuild admin/analytics/billing,
  `config` changes ripple to all five dependents, an app change rebuilds
  only itself; reads a real remote-hit run summary as 7/7 REMOTE.
- `build-package.test.mjs` — nested `src/` files are found (the Lesson 0-era
  "checker only reads the top folder" bug), and a build refuses to run when a
  workspace dependency has no `dist/`.
- `codeowners.test.mjs`, `pr-template.test.mjs` — Lesson 0's 12 tests,
  unchanged.

## Proving the tests are not vacuous

```bash
echo 'import { renderInvoiceLine } from "@pulse/billing";' >> apps/analytics/src/index.js
pnpm exec vitest run tests/boundary-rule.test.mjs   # "has zero boundary violations" now FAILS (1 failed, 11 passed)
git checkout -- apps/analytics/src/index.js          # or undo the line by hand without git
pnpm exec vitest run tests/boundary-rule.test.mjs   # 12 passed
```
