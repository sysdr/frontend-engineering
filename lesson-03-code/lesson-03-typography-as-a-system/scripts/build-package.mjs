#!/usr/bin/env node
// The `build` script every package runs (cwd = that package's folder).
// There is no bundler yet — Next.js arrives in Lesson 20 — so "build" means:
//   1. every @pulse/* import must point at a dependency that is ALREADY built
//      (that is exactly what turbo's `dependsOn: ["^build"]` guarantees), and
//   2. src/ is copied, recursively, into dist/, plus a build-info.json whose
//      sourceHash lets you see that a cached dist/ matches its source.
// Output is deterministic (no timestamps), so a cache hit restores the exact
// bytes a fresh build would have written.
//
// Lesson 2 change: the Control Tower ships .html and .css next to its .js,
// so every file in src/ now feeds the source hash (only .js is scanned for
// imports). For the seven Lesson 1 packages, which are .js-only, the hash
// and the output are byte-for-byte what they were.

import { createHash } from "node:crypto";
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

export function listSourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listSourceFiles(full));
    else out.push(full);
  }
  return out.sort();
}

const IMPORT_RE = /(?:import|export)\s[^"']*?from\s*["']([^"']+)["']|import\s*\(?\s*["']([^"']+)["']/g;

export function workspaceImports(source) {
  const found = new Set();
  for (const match of source.matchAll(IMPORT_RE)) {
    const spec = match[1] ?? match[2];
    if (spec.startsWith("@pulse/")) found.add(spec.split("/").slice(0, 2).join("/"));
  }
  return [...found].sort();
}

export function buildPackage(pkgDir) {
  const pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf-8"));
  const srcDir = join(pkgDir, "src");
  const files = listSourceFiles(srcDir);
  const hash = createHash("sha256");
  const problems = [];

  for (const file of files) {
    const source = readFileSync(file, "utf-8");
    hash.update(relative(pkgDir, file)).update(source);
    if (!file.endsWith(".js")) continue;
    for (const dep of workspaceImports(source)) {
      const builtEntry = join(pkgDir, "node_modules", dep, "dist", "index.js");
      if (!existsSync(builtEntry)) {
        problems.push(`${relative(pkgDir, file)} imports ${dep}, but ${dep} has no dist/ yet — was it built first?`);
      }
    }
  }
  if (problems.length > 0) return { ok: false, name: pkg.name, problems };

  const distDir = join(pkgDir, "dist");
  rmSync(distDir, { recursive: true, force: true });
  cpSync(srcDir, distDir, { recursive: true });
  const info = {
    name: pkg.name,
    files: files.map((f) => relative(srcDir, f).split("\\").join("/")),
    sourceHash: hash.digest("hex").slice(0, 16),
  };
  writeFileSync(join(distDir, "build-info.json"), JSON.stringify(info, null, 2) + "\n");
  return { ok: true, ...info };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = buildPackage(process.cwd());
  if (!result.ok) {
    console.error(`FAIL: ${result.name} did not build:`);
    for (const p of result.problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`built ${result.name}: ${result.files.length} file(s) -> dist/ (source ${result.sourceHash})`);
}
