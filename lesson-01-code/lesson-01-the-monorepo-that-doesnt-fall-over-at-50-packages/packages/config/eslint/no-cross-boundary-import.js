// pulse/no-cross-boundary-import — Lesson 1's boundary rule.
//
// A package's "kind" comes from where it lives, not from a hand-kept list:
//   apps/*      -> "app"     (owned by one team)
//   packages/*  -> "shared"  (owned by every consuming team, see CODEOWNERS)
//
// Four ways an import can break the boundary, each reported separately:
//   appToApp       apps/analytics importing @pulse/billing
//   sharedToApp    packages/contracts importing @pulse/billing
//   undeclared     importing a @pulse/* package missing from package.json
//                  (turbo builds its graph from package.json, so an
//                  undeclared import is also a caching bug waiting to happen)
//   relativeEscape "../../billing/src/x.js" — sneaking past the rule above
//                  by reaching into another package's folder by path

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";

function findUp(startDir, fileName) {
  let dir = startDir;
  while (true) {
    if (existsSync(join(dir, fileName))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const indexCache = new Map();

export function workspaceIndex(repoRoot) {
  if (indexCache.has(repoRoot)) return indexCache.get(repoRoot);
  const index = new Map();
  for (const [group, kind] of [["apps", "app"], ["packages", "shared"]]) {
    const groupDir = join(repoRoot, group);
    if (!existsSync(groupDir)) continue;
    for (const entry of readdirSync(groupDir, { withFileTypes: true })) {
      const manifest = join(groupDir, entry.name, "package.json");
      if (!entry.isDirectory() || !existsSync(manifest)) continue;
      const { name } = JSON.parse(readFileSync(manifest, "utf-8"));
      index.set(name, { kind, dir: `${group}/${entry.name}` });
    }
  }
  indexCache.set(repoRoot, index);
  return index;
}

export const noCrossBoundaryImport = {
  meta: {
    type: "problem",
    docs: { description: "Keep imports inside the Pulse monorepo's package boundaries" },
    schema: [],
    messages: {
      appToApp:
        "{{from}} is an app and may not import another app ({{to}}). Put the shared piece in packages/* and depend on that.",
      sharedToApp:
        "{{from}} is a shared package and may not import an app ({{to}}). Shared code must never depend on its consumers.",
      undeclared:
        "{{from}} imports {{to}} but does not list it in package.json dependencies, so turbo cannot order or cache it correctly.",
      relativeEscape:
        "'{{source}}' reaches outside {{from}}'s own folder. Import other packages by name (@pulse/...) so boundaries stay checkable.",
    },
  },
  create(context) {
    const filename = context.filename;
    const pkgDir = findUp(dirname(filename), "package.json");
    const repoRoot = pkgDir && findUp(pkgDir, "pnpm-workspace.yaml");
    if (!pkgDir || !repoRoot) return {};

    const index = workspaceIndex(repoRoot);
    const self = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf-8"));
    const selfEntry = index.get(self.name);
    if (!selfEntry) return {};
    const declared = new Set(Object.keys({ ...self.dependencies, ...self.peerDependencies }));

    function check(node, source) {
      if (typeof source !== "string") return;
      if (source.startsWith(".")) {
        const target = resolve(dirname(filename), source);
        if (!(target + sep).startsWith(pkgDir + sep) && target !== pkgDir) {
          context.report({ node, messageId: "relativeEscape", data: { from: selfEntry.dir, source } });
        }
        return;
      }
      if (!source.startsWith("@pulse/")) return;
      const name = source.split("/").slice(0, 2).join("/");
      const target = index.get(name);
      if (!target || name === self.name) return;
      const data = { from: selfEntry.dir, to: target.dir };
      if (selfEntry.kind === "app" && target.kind === "app") {
        context.report({ node, messageId: "appToApp", data });
      } else if (selfEntry.kind === "shared" && target.kind === "app") {
        context.report({ node, messageId: "sharedToApp", data });
      } else if (!declared.has(name)) {
        context.report({ node, messageId: "undeclared", data });
      }
    }

    return {
      ImportDeclaration: (node) => check(node, node.source.value),
      ExportNamedDeclaration: (node) => node.source && check(node, node.source.value),
      ExportAllDeclaration: (node) => check(node, node.source.value),
      ImportExpression: (node) => node.source.type === "Literal" && check(node, node.source.value),
    };
  },
};

