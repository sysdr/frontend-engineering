# Lesson 2 — The Pulse Control Tower: your first real UI

Code for **Lesson 2** of *Frontend Engineering & Design at Scale*.
Companion files (in the lesson bundle, next to this zip): `lesson-02-article.md`,
`lesson-02-design-diagram.svg`, `lesson-02-flow-diagram.svg`.

## What this lesson adds (on top of Lesson 1)

- **`apps/control-tower`**, an 8th Turborepo package: a plain-DOM dashboard
  (no framework, no bundler, relative ES module imports only) owned by
  `@pulse/platform-team`.
- **Build board panel**: one coloured strip per package showing what turbo
  did in the selected run (cached here, cached remotely, rebuilt) with its
  duration, plus a bar per recent run you can click to look back.
- **Ownership graph panel**: a node-link diagram drawn by hand in SVG from
  turbo's own dependency graph. Click a package (or a team chip) and the
  CODEOWNERS team(s) and everything they must approve light up. Boundary
  violations from the Lesson 1 ESLint rule are drawn as dashed amber arrows.
- **Live updates**: `apps/control-tower/server/serve.mjs` watches
  `.turbo/runs/`, `.github/CODEOWNERS` and every `src/` folder, and pushes a
  fresh snapshot over Server-Sent Events. The page never polls or reloads.

All data comes from the tooling's own output: `turbo run build --dry=json`,
turbo's `--summarize` run files, CODEOWNERS parsed by the Lesson 0 checker,
and ESLint's API. See `apps/control-tower/server/collect.mjs`.

## Prior state (carried forward from Lesson 1)

The 7-package workspace, Turborepo config, remote cache server, boundary
rule, pre-commit hook, Lesson 0 governance scripts, fixtures and tests.
Changed in Lesson 2:

- Lesson 1's run inspector (`report/`, `scripts/build-report.mjs`,
  `scripts/serve-report.mjs`) grew into the Control Tower and is removed.
  Its "outline what git says is affected" toggle was not carried over;
  `pnpm affected` still prints the same set in the terminal.
- `scripts/build-package.mjs` hashes every file in `src/`, not only `.js`,
  because the Control Tower ships HTML and CSS. Lesson 1 package output is
  unchanged.
- CODEOWNERS gains `apps/control-tower/`; the Lesson 0 test now expects 8
  packages.

## Quick start

```bash
pnpm install
pnpm build        # turbo run build --summarize (8 packages)
pnpm dev          # Control Tower at http://localhost:4100
pnpm test         # turbo per-package tests, then 53 Vitest tests
pnpm test:e2e     # Playwright: the live-update proof in a real browser
```

Exact outputs are in `BUILD.md`, `RUN.md`, `TEST.md`; the lesson's proof,
step by step, is in `VERIFY.md`.

## Layout

```
apps/control-tower/src/       the dashboard (index.html, main.js, styles.css,
                              lib/ pure logic + DOM helper, panels/ the two panels)
apps/control-tower/server/    collect.mjs (data) and serve.mjs (HTTP + SSE + file watching)
apps/{shell,billing,analytics,admin}/, packages/*   carried from Lesson 1
scripts/                      build, remote cache, hooks, Lesson 0 governance
tests/                        Vitest suites (data, DOM, rule, build, cache, L0)
e2e/                          Playwright proof
fixtures/                     a real turbo run summary + a real Control Tower snapshot
```
