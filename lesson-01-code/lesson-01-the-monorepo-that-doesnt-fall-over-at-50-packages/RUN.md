# Run — Lesson 1

## The run inspector

```bash
pnpm build        # at least one summarized run, so there is something to show
pnpm dev
```

Terminal prints `Run inspector: http://localhost:4100`. Open it. You'll see:

- **Build runs** — one tall bar per `turbo run build --summarize`, split into
  green (cache hit on this machine), blue (hit from the remote cache) and
  amber (rebuilt). The number under each bar is cached/total. Click a bar to
  colour the graph with that run.
- **Package graph** — apps on top, `design-system` in the middle, `config`
  and `contracts` at the bottom; each card shows that run's status and
  duration. Click (or Tab + Enter) a package to highlight everything that
  would rebuild if it changed; the side card shows the count, e.g.
  `4 of 7` for `contracts`.
- **Outline what git says is affected** — outlines the packages
  `turbo run build --affected --dry=json` reports against `main` (needs a git
  repo; see VERIFY.md).
- **Import boundaries** — "No boundary violations", or each violation with
  file and line.

The data comes from the server re-running the collector on every request
(`scripts/build-report.mjs`): `.turbo/runs/*.json`, turbo's dry-run graph,
turbo's affected set, ESLint's API and CODEOWNERS. Run another build in a
second terminal and press **Reload data** to see the new bar appear.

Want the JSON without the browser? `pnpm report` writes
`report/data/build-report.json` and prints a one-line summary.

## The remote cache server

```bash
pnpm cache:server
```

```
Pulse remote cache listening on http://localhost:4280  (artifacts in .remote-cache/)
Point turbo at it with: pnpm build:remote
```

It logs `[remote-cache] stored <hash>` on upload and `[remote-cache] hit <hash>`
on download.

## Lesson 0's review simulation (unchanged)

```bash
pnpm review:demo
```

Prints the four fixture PRs: two BLOCKED, two MERGEABLE.
