// Pure functions behind the Control Tower — no DOM, so the package's own
// node tests and the root Vitest suite test them directly, and the browser
// imports the very same file.
// levels/layout/transitiveDependents/statusFor/runCounts/shortName are
// carried forward from Lesson 1's run inspector (report/src/graph.js).

// depth 0 = depends on nothing; each package sits one level above its
// deepest dependency, so every edge points downward.
export function levels(packages) {
  const byName = new Map(packages.map((p) => [p.name, p]));
  const memo = new Map();
  const depth = (name, seen = new Set()) => {
    if (memo.has(name)) return memo.get(name);
    if (seen.has(name)) throw new Error(`dependency cycle at ${name}`);
    seen.add(name);
    const deps = byName.get(name)?.dependencies ?? [];
    const d = deps.length === 0 ? 0 : 1 + Math.max(...deps.map((dep) => depth(dep, seen)));
    memo.set(name, d);
    return d;
  };
  return new Map(packages.map((p) => [p.name, depth(p.name)]));
}

export function layout(packages, { width = 880, nodeWidth = 172, rowHeight = 118, top = 24 } = {}) {
  const lv = levels(packages);
  const maxLevel = Math.max(0, ...lv.values());
  const rows = new Map();
  for (const p of packages) {
    const level = lv.get(p.name);
    if (!rows.has(level)) rows.set(level, []);
    rows.get(level).push(p.name);
  }
  const positions = new Map();
  for (const [level, names] of rows) {
    names.sort();
    const gap = (width - names.length * nodeWidth) / (names.length + 1);
    names.forEach((name, i) => {
      positions.set(name, { x: gap + i * (nodeWidth + gap), y: top + (maxLevel - level) * rowHeight });
    });
  }
  return { positions, height: top * 2 + maxLevel * rowHeight + 64 };
}

// Everything that must rebuild if `name` changes: its dependents, their
// dependents, and so on — the same set `turbo --affected` computes from git.
export function transitiveDependents(packages, name) {
  const byName = new Map(packages.map((p) => [p.name, p]));
  const out = new Set();
  const queue = [...(byName.get(name)?.dependents ?? [])];
  while (queue.length) {
    const next = queue.shift();
    if (out.has(next)) continue;
    out.add(next);
    queue.push(...(byName.get(next)?.dependents ?? []));
  }
  return [...out].sort();
}

export function statusFor(run, packageName) {
  const task = run?.tasks.find((t) => t.package === packageName);
  if (!task) return "not-run";
  if (task.status === "MISS") return "miss";
  return task.source === "REMOTE" ? "hit-remote" : "hit-local";
}

export function runCounts(run) {
  const counts = { "hit-local": 0, "hit-remote": 0, miss: 0 };
  for (const t of run.tasks) counts[statusFor(run, t.package)] += 1;
  return { ...counts, total: run.tasks.length, cached: counts["hit-local"] + counts["hit-remote"] };
}

export function shortName(name) {
  return name.replace(/^@pulse\//, "");
}

// ---- new in Lesson 2 ---------------------------------------------------

export function shortTeam(team) {
  return team.replace(/^@pulse\//, "");
}

// What lights up in the ownership graph. Selecting a package lights its
// CODEOWNERS teams and every package those teams must approve changes to.
// Selecting a team lights exactly the packages CODEOWNERS gives it.
export function highlight(packages, { selectedPackage = null, selectedTeam = null } = {}) {
  let teams = new Set();
  if (selectedPackage) teams = new Set(packages.find((p) => p.name === selectedPackage)?.owners ?? []);
  else if (selectedTeam) teams = new Set([selectedTeam]);
  const lit = new Set(packages.filter((p) => p.owners.some((t) => teams.has(t))).map((p) => p.name));
  return { teams, packages: lit, active: teams.size > 0 };
}

// True when a snapshot carries a turbo run the page has not shown yet —
// the moment the build board flashes its strips.
export function isNewRun(previousRun, nextRun) {
  return Boolean(nextRun) && previousRun?.id !== nextRun.id;
}

export function formatMs(ms) {
  if (ms == null) return "";
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}
