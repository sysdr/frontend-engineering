// The Control Tower dev server (carried forward from Lessons 2-4). Serves both
// apps and the shared packages' source, so import maps point at real files; a
// small JSON API; and a server-sent-events stream that pushes changes live.
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, statSync, watch } from "node:fs";
import { extname, join, normalize } from "node:path";
import { ROOT } from "../../../scripts/workspace.mjs";
import { generate } from "../../../scripts/generate-tokens.mjs";
import { RUNS_DIR, collectBuild, collectOwners, runContrastGate } from "./collect.mjs";

const PORT = Number(process.env.PORT ?? 4100);
const MOUNTS = [
  ["/billing/", "apps/billing/src/"],
  ["/packages/", "packages/"],
  ["/", "apps/control-tower/src/"],
];
/** @type {Record<string, string>} */
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json" };

/** @type {Set<import("node:http").ServerResponse>} */
const clients = new Set();
/** @param {string} event @param {unknown} data */
function push(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) res.write(msg);
}

/** @type {Record<string, () => unknown>} */
const api = {
  "/api/build": collectBuild,
  "/api/owners": collectOwners,
  "/api/contrast": runContrastGate,
};

/** @param {string} urlPath */
function resolveFile(urlPath) {
  for (const [prefix, dir] of MOUNTS) {
    if (!urlPath.startsWith(prefix)) continue;
    const rel = normalize(decodeURIComponent(urlPath.slice(prefix.length))).replace(/^(\.\.[/\\])+/, "");
    // /packages/<name>/src/... only: never expose package.json, node_modules or dist.
    if (prefix === "/packages/" && !/^[\w-]+\/src\//.test(rel)) return null;
    let file = join(ROOT, dir, rel);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    return existsSync(file) ? file : null;
  }
  return null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  if (url.pathname === "/events") {
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" });
    res.write(": connected\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }
  const handler = api[url.pathname];
  if (handler) {
    try {
      const body = JSON.stringify(await handler());
      res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      res.end(body);
    } catch (err) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: String(err) }));
    }
    return;
  }
  const file = resolveFile(url.pathname);
  if (!file) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
  createReadStream(file).pipe(res);
});

/** @param {() => unknown} fn */
function debounce(fn, ms = 150) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let t;
  return () => {
    clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}

// Token edits: regenerate the CSS (as `pnpm tokens` would), re-run the
// contrast gate (as `pnpm lint` would) and tell every open page.
const onTokens = debounce(async () => {
  await generate();
  push("tokens", await runContrastGate());
});
watch(join(ROOT, "packages/design-system/src/tokens"), (_e, name) => {
  if (name && name.endsWith(".js")) onTokens();
});

// Build runs: turbo writes a summary file per `pnpm build`.
mkdirSync(RUNS_DIR, { recursive: true });
const onBuild = debounce(() => push("build", collectBuild()), 300);
watch(RUNS_DIR, onBuild);

server.listen(PORT, () => {
  console.log(`Control Tower: http://localhost:${PORT}/`);
  console.log(`Invoice list:  http://localhost:${PORT}/billing/invoices/`);
});
