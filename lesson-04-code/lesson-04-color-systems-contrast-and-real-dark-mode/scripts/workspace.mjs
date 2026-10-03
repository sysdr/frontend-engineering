// Carried forward from Lesson 1: read the workspace's packages from disk.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));

export function listPackages() {
  const out = [];
  for (const group of ["apps", "packages"]) {
    for (const name of readdirSync(`${ROOT}${group}`)) {
      const file = `${ROOT}${group}/${name}/package.json`;
      if (!existsSync(file)) continue;
      const pkg = JSON.parse(readFileSync(file, "utf-8"));
      out.push({ name: pkg.name, dir: `${group}/${name}`, kind: group === "apps" ? "app" : "package", deps: Object.keys(pkg.dependencies ?? {}) });
    }
  }
  return out.sort((a, b) => a.dir.localeCompare(b.dir));
}

export function readCodeowners() {
  const rules = [];
  for (const line of readFileSync(`${ROOT}.github/CODEOWNERS`, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const [pattern, ...owners] = t.split(/\s+/);
    rules.push({ pattern, owners });
  }
  return rules;
}

/** Last matching rule wins, as on GitHub. @param {string} dir */
export function ownerOf(dir, rules = readCodeowners()) {
  let found = null;
  for (const r of rules) if (`/${dir}/`.startsWith(r.pattern)) found = r.owners;
  return found;
}
