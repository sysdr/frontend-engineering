# Run instructions — Lesson 0

There's no server in this lesson (that starts at Lesson 8). "Running" Lesson
0 means watching the PR-review rule actually enforce itself against the four
fixture PRs in `fixtures/pr-bodies/`.

```bash
pnpm dev
```

Expected output (exact):

```
Pulse platform — PR review simulation (Lesson 0)
==================================================

--- fixtures/pr-bodies/invalid-missing-blast-radius.md ---
✗ BLOCKED —
    - Missing or empty "## Blast Radius" section — every PR must declare which packages it touches.

--- fixtures/pr-bodies/invalid-shared-package-missing-approvals.md ---
✗ BLOCKED —
    - Missing required approval from @pulse/billing-team (owns a package listed in Blast Radius).
    - Missing required approval from @pulse/analytics-team (owns a package listed in Blast Radius).
    - Missing required approval from @pulse/admin-team (owns a package listed in Blast Radius).

--- fixtures/pr-bodies/shared-package-pr-needs-multi-approval.md ---
✓ MERGEABLE — Blast Radius: packages/design-system
  Approvals satisfied: @pulse/platform-team, @pulse/billing-team, @pulse/analytics-team, @pulse/admin-team

--- fixtures/pr-bodies/valid-scoped-pr.md ---
✓ MERGEABLE — Blast Radius: apps/billing
  Approvals satisfied: @pulse/billing-team

==================================================
This is the mechanism from the lesson's architecture decision:
the review process itself enforces package boundaries, automatically.
```

## Trying it on your own PR description

```bash
node scripts/validate-pr-description.mjs path/to/your-pr-body.md
```

Write a markdown file following `.github/PULL_REQUEST_TEMPLATE.md`'s
structure and run the command above — exit code `0` and an `OK:` line means
it would merge; exit code `1` and a `FAIL:` line with reasons means it
wouldn't, under Lesson 0's rule.
