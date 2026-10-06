// Per-package build (turbo runs it inside each package): copy src to dist and
// write a manifest with a content hash, so cache hits and misses are real.
import { cpSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const cwd = process.cwd();
const pkg = JSON.parse(readFileSync(`${cwd}/package.json`, "utf-8"));
rmSync(`${cwd}/dist`, { recursive: true, force: true });
cpSync(`${cwd}/src`, `${cwd}/dist`, { recursive: true });

/** @param {string} dir @returns {string[]} */
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(`${dir}/${f}`).isDirectory() ? walk(`${dir}/${f}`) : [`${dir}/${f}`]));
const hash = createHash("sha256");
const list = walk(`${cwd}/dist`).sort();
for (const f of list) hash.update(readFileSync(f));
writeFileSync(`${cwd}/dist/manifest.json`, JSON.stringify({ name: pkg.name, files: list.length, sha256: hash.digest("hex").slice(0, 16) }, null, 2));
console.log(`built ${pkg.name}: ${list.length} files`);
