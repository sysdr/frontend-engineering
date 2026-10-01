# Lesson 1 — The monorepo that doesn't fall over at 50 packages

Code for **Lesson 1** of *Frontend Engineering & Design at Scale*.
Companion files (in the lesson bundle, next to this zip): `lesson-01-article.md`,
`lesson-01-design-diagram.svg`, `lesson-01-flow-diagram.svg`.

## What this lesson adds (on top of Lesson 0)

- **Turborepo task graph** (`turbo.json`): `build`, `lint`, `test` per package,
  with `build` depending on `^build` so shared packages always build first.
- **Real cross-package dependencies**: every app depends on shared packages
  through `package.json` (`workspace:*`), and imports them by name.
- **Local + remote caching**: `scripts/remote-cache-server.mjs` is a working
  self-hosted remote cache speaking turbo's `/v8/artifacts` API. A fresh
  machine with an empty local cache downloads builds instead of redoing them.
- **Affected-only builds**: `pnpm affected` runs `turbo run build --affected`,
  which builds only packages changed since `main` plus everything downstream.
- **A lint rule for package boundaries**: `pulse/no-cross-boundary-import`
  (ESLint, in `packages/config/eslint/`) fails app→app imports, shared→app
  imports, undeclared workspace imports, and `../../other-package` escapes.
  `pnpm hooks:install` runs it on affected packages before every commit.
- **The run inspector** (`report/`, served by `pnpm dev`): a browser view of
  turbo's own run summaries — per-run cache hit/miss bars, a clickable package
  graph showing what rebuilds when a package changes, git's affected set, and
  live boundary-lint results. Lesson 2 grows this into the Pulse Control Tower.

## Prior state (carried forward from Lesson 0, unchanged unless noted)

The 7-package pnpm workspace, `.github/CODEOWNERS` (Lesson 1 adds entries for
`turbo.json`, `eslint.config.js`, `report/`), the PR template, the PR-description
validator and its fixtures, `branch-protection.json` (Lesson 1 adds the
`boundary-lint` required check), and Lesson 0's 12 tests.

## Quick start

```bash
pnpm install
pnpm build        # turbo run build --summarize
pnpm lint         # boundary rule in every package + CODEOWNERS coverage
pnpm test         # per-package node tests via turbo, then 39 Vitest tests
pnpm dev          # run inspector at http://localhost:4100
```

The full proof (remote cache, affected build, blocked commit, browser check)
is in `VERIFY.md`. `BUILD.md`, `RUN.md` and `TEST.md` cover each piece alone.

## Layout

```
apps/{shell,billing,analytics,admin}/      single-team apps (src/, test/)
packages/{config,contracts,design-system}/ shared packages
packages/config/eslint/                    the pulse ESLint plugin + boundary rule
scripts/                                   build, cache server, report, hooks, L0 governance
report/                                    the run inspector (index.html + src/)
tests/                                     Vitest suites
fixtures/                                  L0 PR bodies + a real turbo run summary
```
