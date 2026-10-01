#!/usr/bin/env node
// `pnpm dev` — serves the run inspector at http://localhost:4100.
// Every request for /data/build-report.json re-collects the report from
// turbo's real output, so "run a build, press Reload" shows the new run.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { collectReport } from "./build-report.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_DIR = join(ROOT, "report");
const PORT = Number(process.env.PORT ?? 4100);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json" };

createServer(async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  try {
    if (path === "/data/build-report.json") {
      const report = await collectReport(ROOT);
      res.writeHead(200, { "content-type": TYPES[".json"], "cache-control": "no-store" });
      return res.end(JSON.stringify(report));
    }
    const file = normalize(join(REPORT_DIR, path === "/" ? "index.html" : path));
    if (!file.startsWith(REPORT_DIR)) throw Object.assign(new Error("outside report/"), { code: "ENOENT" });
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch (err) {
    res.writeHead(err.code === "ENOENT" ? 404 : 500, { "content-type": "text/plain" });
    res.end(err.code === "ENOENT" ? "Not found" : `Report failed: ${err.message}`);
  }
}).listen(PORT, () => console.log(`Run inspector: http://localhost:${PORT}`));
