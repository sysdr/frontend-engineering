#!/usr/bin/env node
// `pnpm dev` — serves the Pulse Control Tower at http://localhost:4100.
//
//   GET /             the dashboard (apps/control-tower/src, served as-is)
//   GET /billing/...  the billing app's pages (apps/billing/src) — Lesson 3's
//                     invoice list lives at /billing/invoices/
//   GET /pkg/<name>/  a shared package's src/, so a page's import map can
//                     point "@pulse/design-system" at real source
//   GET /api/tower    one snapshot of everything the dashboard draws
//   GET /api/events   Server-Sent Events: a fresh snapshot every time turbo
//                     writes a run summary, CODEOWNERS changes, or a source
//                     file changes (so the boundary check re-runs)
//
// "Live" means the page never polls and never reloads: the server watches
// the files turbo and git already write, and pushes.

import { createServer } from "node:http";
import { mkdirSync, watch } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { collectTowerData, REPO_ROOT } from "./collect.mjs";

const APP_SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
const SHARED = ["config", "contracts", "design-system"];

// URL path -> file on disk, or null. Only src/ folders are ever reachable.
export function resolveStatic(root, path) {
  const mounts = [
    ["/billing/", join(root, "apps", "billing", "src")],
    ...SHARED.map((name) => [`/pkg/${name}/`, join(root, "packages", name, "src")]),
    ["/", APP_SRC],
  ];
  const [prefix, base] = mounts.find(([p]) => path.startsWith(p));
  const rest = path.slice(prefix.length);
  const file = normalize(join(base, rest === "" || rest.endsWith("/") ? `${rest}index.html` : rest));
  return file.startsWith(base) ? file : null;
}
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
};

export function startControlTower({ root = REPO_ROOT, port = 4100, log = console.log } = {}) {
  const clients = new Set();
  let pending = null;
  let latest = null;

  async function refresh(reason) {
    latest = await collectTowerData(root);
    const payload = `event: tower\ndata: ${JSON.stringify({ reason, data: latest })}\n\n`;
    for (const res of clients) res.write(payload);
    log(`[control-tower] pushed to ${clients.size} viewer(s): ${reason}`);
  }

  function schedule(reason) {
    clearTimeout(pending);
    pending = setTimeout(() => refresh(reason).catch((err) => log(`[control-tower] refresh failed: ${err.message}`)), 250);
  }

  // Watch the files the tooling already writes — nothing new to keep in sync.
  const runsDir = join(root, ".turbo", "runs");
  mkdirSync(runsDir, { recursive: true });
  const watchers = [
    watch(runsDir, (_event, file) => file?.endsWith(".json") && schedule(`turbo wrote ${file}`)),
    watch(join(root, ".github"), (_event, file) => file === "CODEOWNERS" && schedule("CODEOWNERS changed")),
    ...["apps", "packages"].map((group) =>
      watch(join(root, group), { recursive: true }, (_event, file) => {
        if (file && /(^|[\\/])src[\\/]/.test(file) && !/node_modules|[\\/]dist[\\/]/.test(file)) {
          schedule(`source changed: ${group}/${file}`);
        }
      })
    ),
  ];

  const server = createServer(async (req, res) => {
    const path = new URL(req.url, "http://localhost").pathname;
    try {
      if (path === "/api/tower") {
        latest ??= await collectTowerData(root);
        res.writeHead(200, { "content-type": TYPES[".json"], "cache-control": "no-store" });
        return res.end(JSON.stringify(latest));
      }
      if (path === "/api/events") {
        res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" });
        res.write("retry: 2000\n\n");
        clients.add(res);
        const ping = setInterval(() => res.write(": ping\n\n"), 15000);
        req.on("close", () => {
          clearInterval(ping);
          clients.delete(res);
        });
        return;
      }
      const file = resolveStatic(root, path);
      if (!file) throw Object.assign(new Error("outside the served folders"), { code: "ENOENT" });
      const body = await readFile(file);
      res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
      res.end(body);
    } catch (err) {
      res.writeHead(err.code === "ENOENT" ? 404 : 500, { "content-type": "text/plain" });
      res.end(err.code === "ENOENT" ? "Not found" : `Control Tower failed: ${err.message}`);
    }
  });

  const ready = new Promise((done) =>
    server.listen(port, () => {
      log(`Pulse Control Tower: http://localhost:${server.address().port}`);
      done(server.address().port);
    })
  );

  return {
    server,
    ready,
    close: () =>
      new Promise((done) => {
        clearTimeout(pending);
        watchers.forEach((w) => w.close());
        for (const res of clients) res.end();
        server.close(done);
      }),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startControlTower({ port: Number(process.env.PORT ?? 4100) });
}
