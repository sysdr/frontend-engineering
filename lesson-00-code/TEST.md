# Test instructions — Lesson 0

```bash
pnpm test
```

Expected output (exact pass count):

```
 RUN  v2.1.9 /path/to/lesson-00-engineering-culture-at-multi-team-scale

 ✓ tests/pr-template.test.mjs (7 tests) 7ms
 ✓ tests/codeowners.test.mjs (5 tests) 6ms

 Test Files  2 passed (2)
      Tests  12 passed (12)
```

## What's actually being tested

**`tests/codeowners.test.mjs`** (5 tests) — the CODEOWNERS coverage checker:
correctly lists all 7 real package directories, correctly parses the
CODEOWNERS file format, correctly flags an uncovered package, confirms the
repo's *actual* CODEOWNERS file has zero drift against the *actual* package
directories (not a synthetic sample), and confirms every shared package
lists all 4 teams.

**`tests/pr-template.test.mjs`** (7 tests) — the PR validator, which is the
lesson's real proof criteria made executable:
- passes a correctly single-team-scoped PR
- passes a shared-package PR once every consuming team has approved
- blocks a PR with no Blast Radius section
- **blocks a shared-package PR that's missing even one required team's
  approval** — this is the core rule from "the architecture decision"
  section, and the test asserts all three missing teams are named in the
  error output, not just that it failed
- blocks a PR that lists a package that doesn't exist

## Confirming the tests aren't vacuous

Run this to see a test correctly fail (then it's restored automatically —
don't run this against your own edits without a backup):

```bash
cp .github/CODEOWNERS /tmp/CODEOWNERS.bak
sed -i '/apps\/billing/d' .github/CODEOWNERS
pnpm test    # tests/codeowners.test.mjs's "no drift" test should now FAIL
cp /tmp/CODEOWNERS.bak .github/CODEOWNERS
pnpm test    # back to 12/12 passing
```
