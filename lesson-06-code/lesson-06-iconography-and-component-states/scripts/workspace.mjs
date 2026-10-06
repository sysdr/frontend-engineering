// Carried forward from Lessons 1-2: the workspace, read as data.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Repo root, with a trailing slash. */
export const ROOT = fileURLToPath(new URL("../", import.meta.url));

/** @typedef {{ name: string, dir: string, kind: "app" | "package", deps: string[] }} WorkspacePackage */

/** @returns {WorkspacePackage[]} */
export function listPackages() {
  return ["apps", "packages"]
    .flatMap((group) =>
      readdirSync(`${ROOT}${group}`, { withFileTypes: true })
        .filter((d) => d.isDirectory() && existsSync(`${ROOT}${group}/${d.name}/package.json`))
        .map((d) => {
          const pkg = JSON.parse(readFileSync(`${ROOT}${group}/${d.name}/package.json`, "utf-8"));
          return {
            name: pkg.name,
            dir: `${group}/${d.name}`,
            kind: /** @type {"app" | "package"} */ (group === "apps" ? "app" : "package"),
            deps: Object.keys(pkg.dependencies ?? {}).filter((n) => n.startsWith("@pulse/")),
          };
        }),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** @returns {{ pattern: string, owners: string[] }[]} */
export function readCodeowners(file = `${ROOT}.github/CODEOWNERS`) {
  return readFileSync(file, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const [pattern, ...owners] = l.split(/\s+/);
      return { pattern, owners };
    });
}

/** Owners of a package directory. The last matching rule wins, as on GitHub. */
export function ownerOf(dir, rules = readCodeowners()) {
  /** @type {string[] | null} */
  let found = null;
  for (const r of rules) {
    const prefix = r.pattern.endsWith("/") ? r.pattern : `${r.pattern}/`;
    if (`/${dir}/`.startsWith(prefix)) found = r.owners;
  }
  return found;
}
