// The run inspector's UI. Plain DOM, no framework — React shows up in
// Lesson 13; this stays readable to anyone who knows HTML.
import { layout, transitiveDependents, statusFor, runCounts, shortName } from "./graph.js";

const SVG = "http://www.w3.org/2000/svg";
const NODE_W = 172;
const NODE_H = 72;
const STATUS_TEXT = { "hit-local": "HIT local", "hit-remote": "HIT remote", miss: "MISS", "not-run": "not run" };

const state = { report: null, runIndex: -1, selected: null, showAffected: false };

function el(tag, attrs = {}, text) {
  const node = tag.startsWith("svg:") ? document.createElementNS(SVG, tag.slice(4)) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

function currentRun() {
  const { runs } = state.report;
  return runs.length ? runs[state.runIndex] : null;
}

function renderRuns() {
  const strip = document.getElementById("run-strip");
  strip.replaceChildren();
  const { runs } = state.report;
  if (runs.length === 0) {
    strip.append(el("p", { class: "hint" }, "No build runs recorded yet. Run `pnpm build`, then press Reload data."));
    return;
  }
  runs.forEach((run, i) => {
    const c = runCounts(run);
    const btn = el("button", {
      type: "button", class: "run", role: "option",
      "aria-selected": String(i === state.runIndex),
      "aria-label": `Run ${i + 1}: ${c.cached} of ${c.total} cached (${c["hit-remote"]} from remote), ${c.miss} rebuilt`,
    });
    const bar = el("span", { class: "bar" });
    for (const key of ["hit-local", "hit-remote", "miss"]) {
      if (c[key] === 0) continue;
      const seg = el("span", { class: key });
      seg.style.height = `${(c[key] / c.total) * 100}%`;
      bar.append(seg);
    }
    btn.append(bar, el("span", { class: "count" }, `${c.cached}/${c.total}`), el("span", { class: "label" }, `run ${i + 1}`));
    btn.addEventListener("click", () => { state.runIndex = i; render(); });
    strip.append(btn);
  });
}

function renderGraph() {
  const svg = document.getElementById("graph");
  svg.replaceChildren();
  const { packages, affected } = state.report;
  const { positions, height } = layout(packages, { nodeWidth: NODE_W });
  svg.setAttribute("viewBox", `0 0 880 ${height}`);

  const run = currentRun();
  const impacted = state.selected ? new Set(transitiveDependents(packages, state.selected)) : new Set();
  const affectedSet = state.showAffected && affected.available ? new Set(affected.packages) : new Set();

  // edges first so nodes paint over them: dependent (top) -> dependency (below)
  for (const pkg of packages) {
    const from = positions.get(pkg.name);
    for (const dep of pkg.dependencies) {
      const to = positions.get(dep);
      const x1 = from.x + NODE_W / 2, y1 = from.y + NODE_H, x2 = to.x + NODE_W / 2, y2 = to.y;
      const lit = state.selected && (dep === state.selected || impacted.has(dep)) && impacted.has(pkg.name);
      svg.append(el("svg:path", {
        class: `edge${lit ? " lit" : ""}`,
        d: `M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`,
      }));
    }
  }

  for (const pkg of packages) {
    const { x, y } = positions.get(pkg.name);
    const status = statusFor(run, pkg.name);
    const classes = ["node"];
    if (state.selected === pkg.name) classes.push("selected");
    else if (impacted.has(pkg.name)) classes.push("impacted");
    else if (state.selected) classes.push("dim");

    const g = el("svg:g", {
      class: classes.join(" "), transform: `translate(${x},${y})`, tabindex: "0", role: "button",
      "aria-pressed": String(state.selected === pkg.name),
      "aria-label": `${pkg.name}, ${pkg.kind}, ${STATUS_TEXT[status]}${affectedSet.has(pkg.name) ? ", affected by current changes" : ""}`,
    });
    if (affectedSet.has(pkg.name)) {
      g.append(el("svg:rect", { class: "affected-ring", x: -6, y: -6, width: NODE_W + 12, height: NODE_H + 12, rx: 16 }));
    }
    g.append(el("svg:rect", { class: "body", width: NODE_W, height: NODE_H, rx: 12 }));
    g.append(el("svg:text", { class: "name", x: 14, y: 26 }, shortName(pkg.name)));
    g.append(el("svg:text", { class: "meta", x: 14, y: 45 }, pkg.dir));
    const task = run?.tasks.find((t) => t.package === pkg.name);
    const pillW = status === "hit-remote" ? 84 : status === "hit-local" ? 70 : 52;
    g.append(el("svg:rect", { class: status, x: 14, y: 52, width: pillW, height: 14, rx: 7 }));
    g.append(el("svg:text", { class: "pill-text", x: 14 + pillW / 2, y: 63, "text-anchor": "middle" }, STATUS_TEXT[status]));
    if (task?.durationMs != null) {
      g.append(el("svg:text", { class: "meta", x: NODE_W - 14, y: 63, "text-anchor": "end" }, `${task.durationMs} ms`));
    }
    const toggle = () => { state.selected = state.selected === pkg.name ? null : pkg.name; render(); };
    g.addEventListener("click", toggle);
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    svg.append(g);
  }

  const note = document.getElementById("affected-note");
  note.textContent = affected.available
    ? `turbo --affected (vs ${affected.base}): ${affected.packages.length ? affected.packages.map(shortName).join(", ") : "nothing changed"}`
    : affected.reason;
}

function renderBlast() {
  const box = document.getElementById("blast");
  box.replaceChildren();
  if (!state.selected) {
    box.append(el("p", { class: "hint" }, "Click a package in the graph."));
    return;
  }
  const pkg = state.report.packages.find((p) => p.name === state.selected);
  const impacted = transitiveDependents(state.report.packages, pkg.name);
  const total = state.report.packages.length;
  box.append(
    el("p", { class: "blast-count" }, `${impacted.length + 1} of ${total}`),
    el("p", { class: "hint" }, `packages rebuild when ${shortName(pkg.name)} changes. The other ${total - impacted.length - 1} stay cached.`),
    el("p", {}, `Owned by ${pkg.owners.join(", ") || "nobody (CODEOWNERS gap)"}`),
  );
  const list = el("ul", { class: "plain" });
  for (const name of [pkg.name, ...impacted]) list.append(el("li", {}, name));
  box.append(list);
}

function renderBoundaries() {
  const box = document.getElementById("boundaries");
  box.replaceChildren();
  const found = state.report.boundaryViolations;
  if (found.length === 0) {
    box.append(el("p", { class: "ok" }, "No boundary violations"), el("p", { class: "hint" }, "pulse/no-cross-boundary-import checked every file in apps/*/src and packages/*/src."));
    return;
  }
  box.append(el("p", {}, `${found.length} violation${found.length === 1 ? "" : "s"} — pnpm lint will fail`));
  for (const v of found) {
    const item = el("div", { class: "violation" });
    item.append(el("strong", {}, `${v.file}:${v.line}`), document.createTextNode(v.message));
    box.append(item);
  }
}

function render() {
  renderRuns();
  renderGraph();
  renderBlast();
  renderBoundaries();
}

async function load() {
  const res = await fetch("./data/build-report.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`report request failed: ${res.status}`);
  state.report = await res.json();
  state.runIndex = state.report.runs.length - 1;
  if (state.selected && !state.report.packages.some((p) => p.name === state.selected)) state.selected = null;
  render();
}

document.getElementById("reload").addEventListener("click", () => load());
document.getElementById("show-affected").addEventListener("change", (e) => { state.showAffected = e.target.checked; render(); });
load().catch((err) => {
  document.querySelector("main").prepend(el("p", { class: "violation" }, `Could not load the report: ${err.message}. Is \`pnpm dev\` running?`));
});
