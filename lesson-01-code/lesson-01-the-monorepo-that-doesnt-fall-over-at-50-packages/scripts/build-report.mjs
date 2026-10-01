#!/usr/bin/env node
// Builds the data behind the run inspector (report/) from the SAME sources
// the terminal shows you — nothing hand-maintained:
//   runs        .turbo/runs/*.json   (written by `turbo run build --summarize`)
//   graph       `turbo run build --dry=json`             (turbo's own task graph)
//   affected    `turbo run build --affected --dry=json`  (turbo's own git diff logic)
//   boundaries  ESLint's API running pulse/no-cross-boundary-import
//   owners      .github/CODEOWNERS (Lesson 0)
//
//   node scripts/build-report.mjs            -> writes report/data/build-report.json
//   node scripts/build-report.mjs --stdout   -> prints it instead

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { parseCodeowners } from "./check-codeowners-coverage.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
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

// One run summary -> only what the inspector draws.
export function summarizeRun(summary) {
  const builds = summary.tasks.filter((t) => t.task === "build");
  return {
    id: summary.id,
    command: summary.execution.command,
    startTime: summary.execution.startTime,
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

export function readRuns(root = ROOT) {
  const dir = join(root, ".turbo", "runs");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf-8")))
    .filter((s) => s.tasks?.some((t) => t.task === "build"))
    .map(summarizeRun)
    .sort((a, b) => a.startTime - b.startTime)
    .slice(-MAX_RUNS);
}

// turbo's dry-run JSON -> package nodes with package-level edges.
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

export function readAffected(root = ROOT) {
  if (!existsSync(join(root, ".git"))) {
    return { available: false, reason: "Not a git repository yet — run the git setup in VERIFY.md to see the affected set.", packages: [] };
  }
  try {
    const dry = JSON.parse(turbo(root, ["run", "build", "--affected", "--dry=json"]));
    // "//" is turbo's name for the repo root itself (root scripts, lockfile) — not a package.
    const packages = dry.packages.filter((name) => name !== "//").sort();
    return { available: true, base: process.env.TURBO_SCM_BASE ?? "main", packages };
  } catch (err) {
    return { available: false, reason: `turbo --affected failed: ${String(err.stderr || err.message).trim().split("\n")[0]}`, packages: [] };
  }
}

export async function readBoundaries(root = ROOT) {
  const eslint = new ESLint({ cwd: root });
  const results = await eslint.lintFiles(["apps/*/src/**/*.js", "packages/*/src/**/*.js"]);
  return results.flatMap((r) =>
    r.messages
      .filter((m) => m.ruleId === RULE_ID)
      .map((m) => ({ file: r.filePath.slice(root.length + 1).split("\\").join("/"), line: m.line, message: m.message }))
  );
}

export async function collectReport(root = ROOT) {
  const dry = JSON.parse(turbo(root, ["run", "build", "--dry=json"]));
  const codeowners = readFileSync(join(root, ".github", "CODEOWNERS"), "utf-8");
  return {
    generatedAt: new Date().toISOString(),
    turboVersion: dry.turboVersion,
    packages: graphFromDryRun(dry, codeowners),
    runs: readRuns(root),
    affected: readAffected(root),
    boundaryViolations: await readBoundaries(root),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = await collectReport();
  if (process.argv.includes("--stdout")) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    const out = join(ROOT, "report", "data", "build-report.json");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
    const last = report.runs.at(-1);
    const hits = last ? last.tasks.filter((t) => t.status === "HIT").length : 0;
    console.log(
      `report: ${report.packages.length} packages, ${report.runs.length} run(s)` +
        (last ? `, last run ${hits}/${last.tasks.length} cached` : "") +
        `, ${report.boundaryViolations.length} boundary violation(s) -> report/data/build-report.json`
    );
  }
}
