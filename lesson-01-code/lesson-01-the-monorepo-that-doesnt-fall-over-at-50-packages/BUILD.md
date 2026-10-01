# Build — Lesson 1

## Requirements

- Node.js ≥ 20 (verified on v22.22.2)
- pnpm 9 via corepack: `corepack enable && corepack prepare pnpm@9.15.9 --activate`
- git (only for the affected-build and pre-commit parts)

## Install

```bash
pnpm install
```

Ends with:

```
devDependencies:
+ eslint 9.39.5
+ turbo 2.11.5
+ vitest 2.1.9

Done in 1s using pnpm v9.15.9
```

## Build

```bash
pnpm build
```

Runs `turbo run build --summarize`. There is no bundler yet: each package's
`build` checks that every `@pulse/*` import points at an already-built
dependency, then copies `src/` into `dist/` with a `build-info.json`.
First run on a clean checkout ends with:

```
@pulse/billing:build: built @pulse/billing: 2 file(s) -> dist/ (source 5eebccb0616bff4f)
 Tasks:    7 successful, 7 total
Cached:    0 cached, 7 total
  Time:    3.3s
Summary:    <repo>/.turbo/runs/<run-id>.json
```

Run it again with no changes:

```
 Tasks:    7 successful, 7 total
Cached:    7 cached, 7 total
  Time:    14ms >>> FULL TURBO
```

The source hashes are deterministic, so you should see the same
`5eebccb0616bff4f` for billing on any machine with unchanged source.

## Build against the remote cache

```bash
pnpm cache:server     # terminal A — leave running
pnpm build:remote     # terminal B
```

`build:remote` is the same build with `TURBO_API=http://localhost:4280`,
`TURBO_TOKEN=pulse-dev-token`, `TURBO_TEAM=pulse` set (see
`scripts/with-remote-cache.mjs`). Uploaded artifacts land in `.remote-cache/`.

## Lint / typecheck

```bash
pnpm lint        # turbo run lint (ESLint + pulse/no-cross-boundary-import), then CODEOWNERS coverage
pnpm typecheck   # documented no-op: plain ESM until TypeScript arrives in Lesson 10
```

`pnpm lint` ends with:

```
 Tasks:    7 successful, 7 total
OK: all 7 packages (apps/admin/, apps/analytics/, apps/billing/, apps/shell/, packages/config/, packages/contracts/, packages/design-system/) have CODEOWNERS coverage.
```
