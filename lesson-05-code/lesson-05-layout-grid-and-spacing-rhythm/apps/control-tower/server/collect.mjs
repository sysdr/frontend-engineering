// Carried forward from Lessons 2-4: the Control Tower's data. Each collector
// reads the same source of truth the terminal uses: turbo's own run summary
// and dry run, the CODEOWNERS file, and the contrast gate `pnpm lint` runs.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { ROOT, listPackages, ownerOf, readCodeowners } from "../../../scripts/workspace.mjs";
import { runContrastGate } from "../../../scripts/check-contrast.mjs";

export const RUNS_DIR = `${ROOT}.turbo/runs`;

/** Newest `turbo run build --summarize` output, or null before the first build. */
function latestSummary() {
  if (!existsSync(RUNS_DIR)) return null;
  const files = readdirSync(RUNS_DIR).filter((f) => f.endsWith(".json"));
  if (!files.length) return null;
  const newest = files.map((f) => `${RUNS_DIR}/${f}`).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
  return JSON.parse(readFileSync(newest, "utf-8"));
}

/** Cache status per package from turbo's dry run: what the NEXT build would do. */
function dryRun() {
  const turbo = `${ROOT}node_modules/.bin/turbo`;
  const out = execFileSync(turbo, ["run", "build", "--dry=json"], { cwd: ROOT, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
  return JSON.parse(out);
}

export function collectBuild() {
  const summary = latestSummary();
  const dry = dryRun();
  const rules = readCodeowners();
  const pkgs = listPackages();
  const lastRun = new Map((summary?.tasks ?? []).map((/** @type {any} */ t) => [t.package, t]));
  const packages = dry.tasks
    .map((/** @type {any} */ t) => {
      const last = lastRun.get(t.package);
      const pkg = pkgs.find((p) => p.name === t.package);
      return {
        name: t.package,
        dir: pkg?.dir ?? "",
        owner: pkg ? (ownerOf(pkg.dir, rules)?.[0] ?? null) : null,
        lastStatus: last ? (last.execution?.exitCode === 0 ? (last.cache?.status === "HIT" ? "hit" : "miss") : "failed") : "never",
        lastMs: last?.execution ? last.execution.endTime - last.execution.startTime : null,
        next: t.cache?.status === "HIT" ? "cached" : "will rebuild",
      };
    })
    .sort((/** @type {any} */ a, /** @type {any} */ b) => a.name.localeCompare(b.name));
  return { at: summary?.execution?.endTime ?? null, packages };
}

export function collectOwners() {
  const rules = readCodeowners();
  return listPackages().map((p) => ({ ...p, owner: ownerOf(p.dir, rules)?.[0] ?? null }));
}

export { runContrastGate };
