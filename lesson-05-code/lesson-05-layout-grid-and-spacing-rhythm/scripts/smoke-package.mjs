// Per-package test task: every built module must parse, and Node-importable
// entry points must import cleanly. Browser-only entries ("pulse": { "smoke":
// "syntax" }) are checked for syntax only.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";

const cwd = process.cwd();
const pkg = JSON.parse(readFileSync(`${cwd}/package.json`, "utf-8"));
/** @param {string} dir @returns {string[]} */
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(`${dir}/${f}`).isDirectory() ? walk(`${dir}/${f}`) : [`${dir}/${f}`]));
const modules = walk(`${cwd}/dist`).filter((f) => /\.m?js$/.test(f));
for (const f of modules) execFileSync(process.execPath, ["--check", f]);
if (pkg.pulse?.smoke !== "syntax") await import(pathToFileURL(`${cwd}/${pkg.main.replace("./src/", "dist/")}`).href);
console.log(`smoke ${pkg.name}: ${modules.length} modules parse${pkg.pulse?.smoke === "syntax" ? "" : ", entry imports"}`);
