// Per-package test task: the built entry point must import cleanly in Node
// (browser-only entry points are checked for syntax instead).
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
const entry = (pkg.main ?? "./src/index.js").replace("./src/", "./dist/");
if (pkg.pulse?.browserOnly) {
  execFileSync(process.execPath, ["--check", entry]);
  console.log(`ok ${pkg.name}: ${entry} parses`);
} else {
  const mod = await import(new URL(entry, `file://${process.cwd()}/`).href);
  console.log(`ok ${pkg.name}: ${Object.keys(mod).length} exports`);
}
