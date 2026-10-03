# Lesson 3 — Typography as a system, not a font pick

Code for **Lesson 3** of *Frontend Engineering & Design at Scale*.
Companion files (in the lesson bundle, next to this zip): `lesson-03-article.md`,
`lesson-03-design-diagram.svg`, `lesson-03-flow-diagram.svg`.

## What this lesson adds (on top of Lesson 2)

- **A modular type scale** in `packages/design-system/src/tokens/typography.js`:
  ratio 1.25 from a 16px base, seven roles (caption 12.8px up to display
  48.83px), line-heights on a 4px rhythm, a 12px legibility floor.
- **Generated CSS** in `packages/design-system/src/tokens/typography.css`:
  21 custom properties plus one `.pulse-text-<role>` class per role.
  `pnpm tokens` writes it; `pnpm lint` fails if it drifts.
- **`pulse/no-raw-font-size`**, an ESLint rule in `packages/config/eslint/`
  that runs on JavaScript *and* CSS (via `@eslint/css`). Any `font-size`
  outside the token folder that is not `var(--pulse-font-size-<role>)` fails.
  Its first run caught 15 hand-typed sizes in Lesson 2's own dashboard CSS;
  all are now scale roles.
- **The billing invoice list** (`apps/billing/src/invoices/`), served at
  `http://localhost:4100/billing/invoices/`. A dense table with filters and
  sorting, built only from scale roles. "Show type roles" outlines every text
  element in its role's colour, measured from what the browser rendered.
- **A Control Tower "Type scale" panel**: every role rendered, measured with
  `getComputedStyle` and checked against its token; a staircase drawn from the
  measurements; a ratio picker to compare other scales; and the live result of
  `pulse/no-raw-font-size` across the repo, pushed over the Lesson 2 SSE channel.

## Carried forward from Lesson 2

The monorepo (8 packages, Turborepo, remote cache scripts, CODEOWNERS and the
boundary rule) and the Control Tower (build board, ownership graph, live SSE
server) are carried forward. Changes to them are limited to: the dashboard's
CSS now uses scale roles, graph status pills were resized for caption-size
text, the dev server mounts `apps/billing/src` and shared packages' `src/`, and
`@pulse/control-tower` now depends on `@pulse/design-system`.

Lesson 2's own Vitest and Playwright suites are **not** included in this zip;
the tests here cover Lesson 3 plus the parts of the tower it touched.

## Quick start

    pnpm install
    pnpm build
    pnpm dev        # http://localhost:4100 and http://localhost:4100/billing/invoices/

See BUILD.md, RUN.md, TEST.md and VERIFY.md.
