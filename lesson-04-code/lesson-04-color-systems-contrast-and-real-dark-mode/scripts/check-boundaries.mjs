// Carried forward from Lesson 1: apps may import packages, never other apps,
// and packages may never import apps. Recurses into nested source folders.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { ROOT, listPackages } from "./workspace.mjs";

const pkgs = listPackages();
const byName = new Map(pkgs.map((p) => [p.name, p]));

/** @param {string} dir @returns {string[]} */
function files(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = `${dir}/${f}`;
    if (statSync(p).isDirectory()) return files(p);
    return /\.(m?js)$/.test(f) ? [p] : [];
  });
}

const problems = [];
for (const pkg of pkgs) {
  for (const file of files(`${ROOT}${pkg.dir}/src`)) {
    for (const [, spec] of readFileSync(file, "utf-8").matchAll(/(?:from|import\()\s*["']([^"']+)["']/g)) {
      const target = byName.get(spec.split("/").slice(0, 2).join("/"));
      if (target && target.kind === "app" && target.name !== pkg.name)
        problems.push(`${file.slice(ROOT.length)} imports app ${target.name}`);
    }
  }
}
if (problems.length) {
  problems.forEach((p) => console.error(`FAIL: ${p}`));
  process.exit(1);
}
console.log(`OK: import boundaries hold across ${pkgs.length} packages.`);
