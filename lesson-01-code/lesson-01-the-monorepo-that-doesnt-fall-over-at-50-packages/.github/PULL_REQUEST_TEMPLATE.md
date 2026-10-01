<!--
  Pulse platform PR template — Lesson 0 (carried forward unchanged).
  scripts/validate-pr-description.mjs parses this exact structure. Keep the
  heading text ("## Blast Radius", "## Approvals") unchanged or validation
  will fail to find your entries.
-->

## What changed and why

<!-- One or two sentences. A reviewer should understand the change before
     reading a single line of diff. -->

## Blast Radius

<!-- List every apps/* or packages/* path this PR touches, one per line,
     as a markdown bullet. This is REQUIRED — the PR is rejected by CI
     without it. Listing a package here is what tells the validator which
     CODEOWNERS teams must approve. Tip (Lesson 1): `pnpm affected` prints
     the packages turbo considers affected by your branch. -->

- apps/PACKAGE_NAME

## Approvals

<!-- Filled in as reviewers approve. For a PR touching only a single-team
     package, one entry is enough. For a PR touching a SHARED package
     (design-system, contracts, config), every consuming team listed in
     CODEOWNERS for that path must have an entry here before merge. -->

- @pulse/TEAM_NAME

## How to verify

<!-- The exact command(s) a reviewer runs to confirm this PR does what it
     claims, e.g. `pnpm test -- codeowners`. -->
