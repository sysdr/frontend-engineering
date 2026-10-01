// Carried forward from Lesson 1, plus one Lesson 2 case: non-.js files
// (the Control Tower's HTML and CSS) are copied and feed the source hash.
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { listSourceFiles, workspaceImports, buildPackage } from "../scripts/build-package.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("build-package", () => {
  it("finds source files in nested folders, not just src/index.js", () => {
    const files = listSourceFiles(join(ROOT, "apps", "billing", "src")).map((f) => f.slice(ROOT.length + 1));
    expect(files).toEqual(["apps/billing/src/index.js", "apps/billing/src/lines/render-line.js"]);
  });

  it("reads @pulse/* specifiers from import, export-from and dynamic import", () => {
    const src = 'import a from "@pulse/contracts";\nexport * from "@pulse/config/sub";\nconst b = import("@pulse/design-system");\nimport x from "lodash";';
    expect(workspaceImports(src)).toEqual(["@pulse/config", "@pulse/contracts", "@pulse/design-system"]);
  });

  it("refuses to build when a workspace dependency has no dist/ yet", () => {
    const dir = mkdtempSync(join(tmpdir(), "pulse-build-"));
    mkdirSync(join(dir, "src"));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "@pulse/tmp" }));
    writeFileSync(join(dir, "src", "index.js"), 'import { x } from "@pulse/contracts";\n');
    const result = buildPackage(dir);
    expect(result.ok).toBe(false);
    expect(result.problems[0]).toMatch(/@pulse\/contracts has no dist\/ yet/);
    expect(existsSync(join(dir, "dist"))).toBe(false);
  });

  it("builds a leaf package into dist/ with a stable source hash", () => {
    const dir = mkdtempSync(join(tmpdir(), "pulse-build-"));
    mkdirSync(join(dir, "src", "deep"), { recursive: true });
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "@pulse/leaf" }));
    writeFileSync(join(dir, "src", "index.js"), 'export * from "./deep/x.js";\n');
    writeFileSync(join(dir, "src", "deep", "x.js"), "export const x = 1;\n");
    const first = buildPackage(dir);
    const second = buildPackage(dir);
    expect(first.ok).toBe(true);
    expect(first.files).toEqual(["deep/x.js", "index.js"]);
    expect(existsSync(join(dir, "dist", "deep", "x.js"))).toBe(true);
    expect(second.sourceHash).toBe(first.sourceHash);
  });

  it("Lesson 2: copies HTML/CSS and lets a CSS-only change move the hash", () => {
    const dir = mkdtempSync(join(tmpdir(), "pulse-build-"));
    mkdirSync(join(dir, "src"));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "@pulse/ui" }));
    writeFileSync(join(dir, "src", "index.html"), "<p>hi</p>\n");
    writeFileSync(join(dir, "src", "styles.css"), "p { color: navy; }\n");
    const before = buildPackage(dir);
    writeFileSync(join(dir, "src", "styles.css"), "p { color: teal; }\n");
    const after = buildPackage(dir);
    expect(before.files).toEqual(["index.html", "styles.css"]);
    expect(existsSync(join(dir, "dist", "styles.css"))).toBe(true);
    expect(after.sourceHash).not.toBe(before.sourceHash);
  });
});
