# Run — Lesson 2

```bash
pnpm build      # so there is at least one run to show
pnpm dev
```

The terminal prints:

```
Pulse Control Tower: http://localhost:4100
```

Open **http://localhost:4100**. Use another port with `PORT=4200 pnpm dev`.

## What you see

- **Top right**: a badge reading `Live, watching turbo` with a green dot
  once the page is subscribed to the server's event stream. If the server
  stops, it switches to `Reconnecting to the tower server` (amber dot) and
  recovers by itself when the server comes back.
- **Build board (left)**: a sentence such as `8 of 8 packages came from
  cache, nothing rebuilt. Took 26 ms, finished 6:22:14 AM.`, a small bar per
  recent run (green = cached here, blue = cached remotely, amber = rebuilt,
  number = cached/total), and one strip per package: name, folder, owning
  team, status word, and either the build time or the time the cache saved.
  Click an older bar to colour everything by that run.
- **Ownership and boundaries (right)**: one chip per CODEOWNERS team with the
  number of packages it must approve, then the package graph: apps on top,
  `design-system` in the middle, `config`, `contracts` and `control-tower`
  at the bottom. Shared packages have a dashed outline. Click a node (or
  Tab to it and press Enter) to select it; click a team chip to see that
  team's packages. The text under the graph explains the selection and lists
  any boundary violations.

## What the server does

Every time turbo writes `.turbo/runs/*.json`, CODEOWNERS changes, or a file
under any `src/` changes, the server re-collects and pushes. Its log shows
each push:

```
[control-tower] pushed to 1 viewer(s): source changed: apps/billing/src/index.js
[control-tower] pushed to 1 viewer(s): turbo wrote 3K58U6AeVINxdwM3tCwy6Vg23Gc.json
```

To see the raw data the page draws: `curl http://localhost:4100/api/tower`,
or without a server, `node apps/control-tower/server/collect.mjs`.

The board updates when turbo finishes a run and writes its summary (about a
second for this repo), not task by task while the run is still going.
