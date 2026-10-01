# Verify — Lesson 1's proof

Matches the article's "The proof" section, command for command. Use two
terminals, both in this folder. Every expected output below was recorded
from a fresh unzip of this lesson's zip.

## 0. Set up

```bash
pnpm install
git init -b main
git add -A
git commit -m "lesson 1 baseline"
```

(If git asks who you are: `git config user.email you@example.com && git config user.name you`, then commit again.)

## 1. Remote cache: a new machine downloads instead of rebuilding

Terminal A:

```bash
pnpm cache:server
```

Terminal B:

```bash
pnpm build:remote
```
Expect `Cached:    0 cached, 7 total`. Terminal A logs seven `[remote-cache] stored ...` lines.

```bash
pnpm build
```
Expect `Cached:    7 cached, 7 total` and `>>> FULL TURBO` (local cache).

```bash
pnpm clean:local
```
Expect `removed 8 folder(s): .turbo/cache, apps/admin/dist, ...` — this machine now has no local cache and no build output, like a fresh CI runner.

```bash
pnpm build:remote
```
Expect every package to print `cache hit, replaying logs <hash>`, then
`Cached:    7 cached, 7 total` and `>>> FULL TURBO`. Terminal A logs seven
`[remote-cache] hit ...` lines, and `apps/billing/dist/` exists again.

## 2. Affected-only: change one shared package, build only what depends on it

```bash
git checkout -b feature/invoice-currency
echo 'export const DEFAULT_CURRENCY = "USD";' >> packages/contracts/src/index.js
pnpm affected
```

Expect:

```
   • Packages in scope: @pulse/admin, @pulse/analytics, @pulse/billing, @pulse/contracts
   • Running build in 4 packages
@pulse/contracts:build: cache miss, executing ...
 Tasks:    6 successful, 6 total
Cached:    2 cached, 6 total
```

Four packages rebuild. `shell` does not run at all. The two extra cached
tasks are `config` and `design-system`: in-scope apps depend on them
(`^build`), so turbo restores them from cache instead of rebuilding.

## 3. The boundary rule stops a bad import before review

```bash
echo 'import { renderInvoiceLine } from "@pulse/billing";' >> apps/analytics/src/index.js
pnpm lint
```

Expect exit code 1 and:

```
@pulse/analytics:lint:   10:1  error  apps/analytics is an app and may not import another app (apps/billing). Put the shared piece in packages/* and depend on that  pulse/no-cross-boundary-import
Failed:    @pulse/analytics#lint
```

Now the same thing at commit time:

```bash
pnpm hooks:install
git add -A
git commit -m "try it"
```

Expect `OK: installed .git/hooks/pre-commit`, then the commit is refused:

```
pre-commit: boundary lint on affected packages
@pulse/analytics:lint:   10:1  error  apps/analytics is an app and may not import another app ...
pre-commit: blocked — fix the import above, or it would fail CI anyway.
```

`git log --oneline` still shows only `lesson 1 baseline`. Undo the bad line:

```bash
git restore --staged --worktree apps/analytics/src/index.js
pnpm lint
```

Expect exit code 0 and the `OK: all 7 packages ... have CODEOWNERS coverage.` line.

## 4. See it in the browser

```bash
pnpm dev
```

Open **http://localhost:4100** and check:

1. **Build runs** shows four bars, left to right: `0/7` (all amber), `7/7`
   (all green, local), `7/7` (all blue, remote), `2/6` (amber and green, the
   affected run). The last one is selected.
2. Click the blue `7/7` bar. Every card in the graph says `HIT remote`.
3. Click the **contracts** card. The side card reads `4 of 7`, lists
   contracts, admin, analytics, billing; shell, design-system and config fade out.
4. Tick **Outline what git says is affected**. The line under the heading
   reads `turbo --affected (vs main): admin, analytics, billing, contracts`
   and exactly those four cards get a dashed outline — the set you clicked
   in step 3 and the set turbo computed from git are the same.
5. The **Import boundaries** card reads `No boundary violations`. In another
   terminal re-add the bad import from step 3, press **Reload data**, and the
   card shows `1 violation — pnpm lint will fail` with
   `apps/analytics/src/index.js:10`. Undo it again with
   `git checkout -- apps/analytics/src/index.js`.

Keyboard check: Tab reaches the run bars and every graph card; Enter on a
card selects it.

## 5. Automated

```bash
pnpm test
```

Expect `Tasks:    14 successful, 14 total` from turbo, then
`Test Files  6 passed (6)` and `Tests  39 passed (39)` from Vitest.

## Checklist

- [ ] `pnpm build:remote` on an empty machine: 0/7 cached; after `pnpm clean:local`, 7/7 from remote
- [ ] `pnpm affected` after a contracts change: 4 packages in scope, shell not run
- [ ] `pnpm lint` fails with the appToApp message on the added import, passes after undo
- [ ] the pre-commit hook refuses the commit
- [ ] browser: four run bars, `4 of 7` for contracts, git's affected outline matches
- [ ] browser: boundary card flips to `1 violation` and back after Reload data
- [ ] `pnpm test`: 39 Vitest tests pass
