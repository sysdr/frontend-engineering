# Build instructions — Lesson 0

## Requirements
- Node.js ≥ 20 (tested on v22.22.2)
- pnpm 9.x via corepack: `corepack enable && corepack prepare pnpm@9 --activate`

## Install

```bash
pnpm install
```

Expected output ends with:
```
devDependencies:
+ vitest 2.1.9
Done in ~4s using pnpm v9.15.9
```

## Build

```bash
pnpm build
```

This runs the CODEOWNERS coverage check (there's no bundler yet — Lesson 0 has
no shippable UI, its "build" is the governance layer being internally
consistent). Expected output:

```
OK: all 7 packages (apps/admin/, apps/analytics/, apps/billing/, apps/shell/,
packages/config/, packages/contracts/, packages/design-system/) have
CODEOWNERS coverage.
```

Exit code `0` on success. If any `apps/*` or `packages/*` directory is added
without a matching `.github/CODEOWNERS` line, this fails with exit code `1`
and names the uncovered directory — verified directly: temporarily deleting
the `apps/billing` line from CODEOWNERS and re-running `pnpm build` fails
with `FAIL: the following packages have no CODEOWNERS entry: - apps/billing/`.

## Lint / Typecheck

```bash
pnpm lint       # same check as build — a lint rule literally is "is the boundary declared"
pnpm typecheck  # no-op — this lesson ships plain ESM, TS starts at Lesson 5
```

## Applying branch protection for real (optional, once this is a real GitHub repo)

```bash
GITHUB_TOKEN=ghp_xxx GITHUB_REPO=your-org/pulse-platform \
  node scripts/apply-branch-protection.mjs --apply
```

Without `--apply`, the script only validates and prints the policy (dry run)
— this is what CI and this lesson's automated verification actually run,
since a live GitHub repo and token aren't available in this sandboxed
environment.
