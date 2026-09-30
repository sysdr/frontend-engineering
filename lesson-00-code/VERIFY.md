# Verify — Lesson 0's proof criteria

The lesson's proof: **"Three merged PRs, each correctly scoped to one
package, each with an accurate blast-radius note."** This lesson simulates
that with real, executable validation instead of a manual walkthrough.

Run all of this from a clean checkout:

```bash
pnpm install
pnpm verify
```

`pnpm verify` runs, in order: the CODEOWNERS coverage check, the PR
validator against a real single-team-scoped fixture, and the full test
suite. All three must pass. Observed output:

```
OK: all 7 packages (...) have CODEOWNERS coverage.
OK: fixtures/pr-bodies/valid-scoped-pr.md is correctly scoped.
  Blast Radius: apps/billing
  Required approvals present: @pulse/billing-team

 Test Files  2 passed (2)
      Tests  12 passed (12)
```

## Step-by-step, matching the lesson's three proof PRs

**PR 1 — a correctly-scoped, single-team PR:**
```bash
node scripts/validate-pr-description.mjs fixtures/pr-bodies/valid-scoped-pr.md
```
Expect exit code `0` and `OK: ... is correctly scoped.`

**PR 2 — a correctly-scoped, shared-package PR with full multi-team
approval:**
```bash
node scripts/validate-pr-description.mjs fixtures/pr-bodies/shared-package-pr-needs-multi-approval.md
```
Expect exit code `0` and all 4 teams listed under "Required approvals
present".

**PR 3 (negative control) — the same shared-package change, before every
team has approved, to prove the boundary rule is actually enforced and not
just documented:**
```bash
node scripts/validate-pr-description.mjs fixtures/pr-bodies/invalid-shared-package-missing-approvals.md
echo "exit code: $?"
```
Expect exit code `1`, and the three missing teams (`@pulse/billing-team`,
`@pulse/analytics-team`, `@pulse/admin-team`) named explicitly in the
output — this is the proof that "the review process itself enforces
architecture boundaries" (the lesson's takeaway) is true of this code, not
just asserted by it.

## Full checklist

- [ ] `pnpm install` — completes with no errors
- [ ] `pnpm build` — prints `OK: all 7 packages ... have CODEOWNERS coverage.`
- [ ] `pnpm lint` — same, exit 0
- [ ] `pnpm typecheck` — exit 0 (documented no-op)
- [ ] `pnpm test` — `12 passed (12)`, 2 test files
- [ ] `pnpm dev` — prints 2 BLOCKED and 2 MERGEABLE fixtures, matching RUN.md exactly
- [ ] `node scripts/apply-branch-protection.mjs` (no `--apply`) — prints a
      valid dry-run policy JSON, exit 0
- [ ] Deliberately removing a line from `.github/CODEOWNERS` and re-running
      `pnpm build` fails with exit code `1` and names the uncovered package
      (then restore the file)
