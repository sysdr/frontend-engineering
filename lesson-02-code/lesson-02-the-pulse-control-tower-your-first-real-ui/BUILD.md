# Build — Lesson 2

## Requirements

- Node.js ≥ 20 (verified on v22.22.2)
- pnpm 9 via corepack: `corepack enable && corepack prepare pnpm@9.15.9 --activate`
- For `pnpm test:e2e` only: a Playwright Chromium, installed once with
  `pnpm exec playwright install chromium`

## Install

```bash
pnpm install
```

Ends with:

```
devDependencies:
+ @playwright/test 1.56.0
+ eslint 9.39.5
+ jsdom 25.0.1
+ turbo 2.11.6
+ vitest 2.1.9
```

## Build

```bash
pnpm build
```

There is still no bundler: each package's build checks its `@pulse/*`
imports point at already-built dependencies, then copies `src/` to `dist/`.
The Control Tower builds the same way (its HTML, CSS and JS land in
`apps/control-tower/dist/`). First run on a clean checkout:

```
  Tasks:    8 successful, 8 total
 Cached:    0 cached, 8 total
   Time:    3.36s
Summary:    <repo>/.turbo/runs/<run-id>.json
```

Second run, nothing changed:

```
  Tasks:    8 successful, 8 total
 Cached:    8 cached, 8 total
   Time:    26ms >>> FULL TURBO
```

The `Summary:` file is exactly what the Control Tower's build board reads.

## Lint / typecheck

```bash
pnpm lint
pnpm typecheck
```

`pnpm lint` runs ESLint (with `pulse/no-cross-boundary-import`) in all 8
packages, then the CODEOWNERS coverage check, and ends with:

```
OK: all 8 packages (apps/admin/, apps/analytics/, apps/billing/, apps/control-tower/, apps/shell/, packages/config/, packages/contracts/, packages/design-system/) have CODEOWNERS coverage.
```

`pnpm typecheck` is a documented no-op until TypeScript arrives in Lesson 10:

```
Lesson 2 ships plain ESM (no TS surface yet) — typecheck is a no-op until Lesson 10
```

The remote cache from Lesson 1 works unchanged: `pnpm cache:server` in one
terminal, `pnpm build:remote` in another.
