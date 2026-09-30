# Lesson 0 — Engineering culture at multi-team scale

Code for **Lesson 0** of *Frontend Engineering & Design at Scale*.
Companion article: `lesson-00-article.md` (in the parent artifact bundle, not
this zip). Diagrams: `lesson-00-design-diagram.svg`, `lesson-00-flow-diagram.svg`.

> **This is the curriculum's one flagged exception to "every lesson ships a
> visible UI."** There is genuinely nothing to look at yet — no framework,
> no dashboard, no rendered anything. The Pulse Control Tower (this
> course's persistent visual thread) starts at Lesson 2. This lesson's job
> is entirely governance: who owns what, and how a PR proves it respects
> that. See `lesson-00-article.md`, "The visual deliverable," for why this
> exception is stated up front rather than silently skipped.

## What this lesson adds

The skeleton of the Pulse platform monorepo (`apps/shell`, `apps/billing`,
`apps/analytics`, `apps/admin`, `packages/design-system`, `packages/contracts`,
`packages/config` — each a real, minimal pnpm workspace package) plus the
governance layer the rest of the course builds on:

- **`.github/CODEOWNERS`** — every package mapped to its owning team; shared
  packages require sign-off from every consuming team.
- **`.github/PULL_REQUEST_TEMPLATE.md`** — requires a "Blast Radius" field.
- **`.github/branch-protection.json`** — the declarative policy this repo's
  `main` branch should run under once it's a real GitHub repo.
- **Working scripts** (`scripts/`) that make the rule executable, not just
  documented: a CODEOWNERS-coverage checker, and a PR-description validator
  that enforces the "shared packages need every team's approval" rule for
  real, against fixture PR bodies.

## Prior state

None — this is Lesson 0, the greenfield starting point for the whole course.

## Quick start

```bash
pnpm install
pnpm build      # checks CODEOWNERS coverage
pnpm test       # runs the real test suite
pnpm dev        # walks 4 fixture PRs through the validator, prints the result
```

See `BUILD.md`, `RUN.md`, `TEST.md`, `VERIFY.md` for full detail.
