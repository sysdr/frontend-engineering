// Collects everything the Control Tower draws, from the SAME sources the
// terminal shows you. Nothing here is hand-maintained:
//   packages + edges   `turbo run build --dry=json`   (turbo's own task graph)
//   runs               .turbo/runs/*.json             (written by `--summarize`)
//   owners + teams     .github/CODEOWNERS, parsed by the Lesson 0 checker itself
//   violations         ESLint's API running pulse/no-cross-boundary-import
//
// Grown out of Lesson 1's scripts/build-report.mjs (the run inspector's
// collector). New in Lesson 2: a team index, and violations that know which
// package they point at, so the graph can draw them as edges.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { parseCodeowners } from "../../../scripts/check-codeowners-coverage.mjs";

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const RULE_ID = "pulse/no-cross-boundary-import";
const MAX_RUNS = 12;

function turbo(root, args) {
  const bin = join(root, "node_modules", ".bin", process.platform === "win32" ? "turbo.cmd" : "turbo");
  return execFileSync(bin, args, {
    cwd: root,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, TURBO_TELEMETRY_DISABLED: "1" },
    shell: process.platform === "win32",
  });
}

// One turbo run summary -> only what the build board draws.
export function summarizeRun(summary) {
  const builds = summary.tasks.filter((t) => t.task === "build");
  return {
    id: summary.id,
    command: summary.execution.command,
    startTime: summary.execution.startTime,
    endTime: summary.execution.endTime,
    durationMs: summary.execution.endTime - summary.execution.startTime,
    exitCode: summary.execution.exitCode,
    tasks: builds
      .map((t) => ({
        package: t.package,
        status: t.cache.status, // "HIT" | "MISS"
        source: t.cache.source ?? null, // "LOCAL" | "REMOTE" | null
        durationMs: t.execution ? t.execution.endTime - t.execution.startTime : null,
        timeSavedMs: t.cache.timeSaved ?? 0,
      }))
      .sort((a, b) => a.package.localeCompare(b.package)),
  };
}

export function readRuns(root = REPO_ROOT) {
  const dir = join(root, ".turbo", "runs");
  if (!existsSync(dir)) return [];
  const runs = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    try {
      const summary = JSON.parse(readFileSync(join(dir, file), "utf-8"));
      if (summary.tasks?.some((t) => t.task === "build")) runs.push(summarizeRun(summary));
    } catch {
      // turbo may still be writing this file; the next change event re-reads it
    }
  }
  return runs.sort((a, b) => a.startTime - b.startTime).slice(-MAX_RUNS);
}

// turbo's dry-run JSON + CODEOWNERS -> package nodes with package-level edges.
export function graphFromDryRun(dry, codeownersText = "") {
  const owners = parseCodeowners(codeownersText);
  const pkgOf = (taskId) => taskId.split("#")[0];
  return dry.tasks
    .filter((t) => t.task === "build")
    .map((t) => ({
      name: t.package,
      dir: t.directory,
      kind: t.directory.startsWith("apps/") ? "app" : "shared",
      owners: owners.get(`${t.directory}/`) ?? [],
      dependencies: t.dependencies.map(pkgOf).sort(),
      dependents: t.dependents.map(pkgOf).sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Every team named in CODEOWNERS for a package, with the packages it owns.
export function teamIndex(packages) {
  const teams = new Map();
  for (const pkg of packages) {
    for (const team of pkg.owners) {
      if (!teams.has(team)) teams.set(team, []);
      teams.get(team).push(pkg.name);
    }
  }
  return [...teams.entries()]
    .map(([team, owned]) => ({ team, packages: owned.sort() }))
    .sort((a, b) => a.team.localeCompare(b.team));
}

// ESLint tells us the file and line; that line tells us what was imported.
// Resolve the import back to a package so the graph can draw the violation
// as a link between two real nodes.
export function violationTarget(sourceLine, fromDir, packages) {
  const spec = sourceLine.match(/["']([^"']+)["']/)?.[1];
  if (!spec) return null;
  if (spec.startsWith("@pulse/")) {
    const name = spec.split("/").slice(0, 2).join("/");
    return packages.some((p) => p.name === name) ? name : null;
  }
  if (spec.startsWith(".")) {
    const target = join(fromDir, spec).split("\\").join("/");
    return packages.find((p) => target === p.dir || target.startsWith(`${p.dir}/`))?.name ?? null;
  }
  return null;
}

export async function readBoundaries(root = REPO_ROOT, packages = []) {
  const eslint = new ESLint({ cwd: root });
  const results = await eslint.lintFiles(["apps/*/src/**/*.js", "packages/*/src/**/*.js"]);
  return results.flatMap((r) => {
    const found = r.messages.filter((m) => m.ruleId === RULE_ID);
    if (found.length === 0) return [];
    const file = r.filePath.slice(root.length + 1).split("\\").join("/");
    const lines = readFileSync(r.filePath, "utf-8").split("\n");
    const from = packages.find((p) => file.startsWith(`${p.dir}/`));
    return found.map((m) => ({
      file,
      line: m.line,
      kind: m.messageId,
      message: m.message,
      from: from?.name ?? null,
      to: from ? violationTarget(lines[m.line - 1] ?? "", dirname(file), packages) : null,
    }));
  });
}

export async function collectTowerData(root = REPO_ROOT) {
  const dry = JSON.parse(turbo(root, ["run", "build", "--dry=json"]));
  const codeowners = readFileSync(join(root, ".github", "CODEOWNERS"), "utf-8");
  const packages = graphFromDryRun(dry, codeowners);
  return {
    generatedAt: new Date().toISOString(),
    turboVersion: dry.turboVersion,
    packages,
    teams: teamIndex(packages),
    runs: readRuns(root),
    boundaryViolations: await readBoundaries(root, packages),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(await collectTowerData(), null, 2));
}
