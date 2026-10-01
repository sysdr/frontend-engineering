#!/usr/bin/env node
// A small, real Turborepo remote cache: the same HTTP API turbo speaks to
// Vercel's hosted cache, backed by a folder on disk (.remote-cache/).
// In a real org this runs once, centrally; every laptop and CI runner
// points at it, so a build one machine already did is a download for
// everyone else.
//
//   GET  /v8/artifacts/status       -> is caching enabled?
//   HEAD /v8/artifacts/:hash        -> does this artifact exist?
//   GET  /v8/artifacts/:hash        -> download it
//   PUT  /v8/artifacts/:hash        -> upload it
//   POST /v8/artifacts              -> batch existence query
//   POST /v8/artifacts/events       -> hit/miss telemetry (logged, not stored)

import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const DEFAULT_PORT = 4280;
export const DEV_TOKEN = "pulse-dev-token";

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolveBody(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export function createCacheServer({ dir = join(ROOT, ".remote-cache"), token = DEV_TOKEN, log = console.log } = {}) {
  mkdirSync(dir, { recursive: true });
  const stats = { uploads: 0, hits: 0, misses: 0 };
  const artifactPath = (hash) => join(dir, hash.replace(/[^a-zA-Z0-9]/g, ""));

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const send = (status, body, headers = {}) => {
      res.writeHead(status, { "content-type": "application/json", ...headers });
      res.end(body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body));
    };

    if (req.headers.authorization !== `Bearer ${token}`) return send(401, { error: "bad token" });

    if (url.pathname === "/v8/artifacts/status") return send(200, { status: "enabled" });
    if (url.pathname === "/v8/artifacts/events") {
      await readBody(req);
      return send(200, {});
    }
    if (url.pathname === "/v8/artifacts" && req.method === "POST") {
      const { hashes = [] } = JSON.parse((await readBody(req)).toString() || "{}");
      const result = {};
      for (const h of hashes) {
        const p = artifactPath(h);
        result[h] = existsSync(p) ? { size: statSync(p).size } : null;
      }
      return send(200, result);
    }

    const match = url.pathname.match(/^\/v8\/artifacts\/([a-zA-Z0-9]+)$/);
    if (!match) return send(404, { error: "not found" });
    const hash = match[1];
    const file = artifactPath(hash);

    if (req.method === "PUT") {
      writeFileSync(file, await readBody(req));
      stats.uploads += 1;
      log(`[remote-cache] stored   ${hash}`);
      return send(202, { urls: [] });
    }
    if (req.method === "HEAD" || req.method === "GET") {
      if (!existsSync(file)) {
        stats.misses += 1;
        log(`[remote-cache] miss     ${hash}`);
        return send(404, req.method === "GET" ? { error: "not found" } : undefined);
      }
      if (req.method === "HEAD") return send(200, undefined, { "content-type": "application/octet-stream" });
      stats.hits += 1;
      log(`[remote-cache] hit      ${hash}`);
      res.writeHead(200, { "content-type": "application/octet-stream" });
      return res.end(readFileSync(file));
    }
    return send(405, { error: "method not allowed" });
  });

  return { server, stats };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  const { server } = createCacheServer();
  server.listen(port, () => {
    console.log(`Pulse remote cache listening on http://localhost:${port}  (artifacts in .remote-cache/)`);
    console.log("Point turbo at it with: pnpm build:remote");
  });
}
