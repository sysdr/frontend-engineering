// Panel 2 — the ownership graph. A node-link diagram drawn by hand in SVG:
// a node is a <g> holding a rounded <rect> and some <text>; a link is a
// <path> from a package down to a package it depends on. Violations of the
// Lesson 1 boundary rule are drawn as their own dashed, arrowed links.
import { el } from "../lib/dom.js";
import { highlight, layout, shortName, shortTeam, statusFor, transitiveDependents } from "../lib/graph.js";
import { STATUS_WORD } from "./build-board.js";

const W = 880;
const NODE_W = 172;
const NODE_H = 76;
// Pill widths fit their words at the scale's caption size (Lesson 3).
const PILL = { "hit-local": 100, "hit-remote": 122, miss: 74, "not-run": 128 };

// A link leaves the bottom of the dependent and lands on the top of the
// dependency. `ports` spreads several links across a card's edge so they
// don't all meet in one point.
export function linkPath(from, to, { fromX = NODE_W / 2, toX = NODE_W / 2 } = {}) {
  const x1 = from.x + fromX;
  const x2 = to.x + toX;
  if (Math.abs(from.y - to.y) < 1) {
    // same row: arc over the top of both cards
    return `M${x1},${from.y} C${x1},${from.y - 56} ${x2},${to.y - 56} ${x2},${to.y - 2}`;
  }
  const down = to.y > from.y;
  const y1 = down ? from.y + NODE_H : from.y;
  const y2 = down ? to.y - 2 : to.y + NODE_H + 2;
  const mid = (y1 + y2) / 2;
  return `M${x1},${y1} C${x1},${mid} ${x2},${mid} ${x2},${y2}`;
}

// For every dependency link, where it should leave and arrive: links are
// ordered by where the other end sits, then spaced evenly along the middle
// 60% of the card's edge.
export function ports(packages, positions) {
  const spread = (count, i) => (count === 1 ? NODE_W / 2 : NODE_W * (0.2 + (0.6 * i) / (count - 1)));
  const out = new Map();
  for (const pkg of packages) {
    const deps = [...pkg.dependencies].sort((a, b) => positions.get(a).x - positions.get(b).x);
    deps.forEach((dep, i) => out.set(`${pkg.name}>${dep}`, { fromX: spread(deps.length, i) }));
  }
  for (const pkg of packages) {
    const users = [...pkg.dependents].sort((a, b) => positions.get(a).x - positions.get(b).x);
    users.forEach((user, i) => Object.assign(out.get(`${user}>${pkg.name}`), { toX: spread(users.length, i) }));
  }
  return out;
}

function renderChips(container, teams, litTeams, selectedTeam, onPickTeam) {
  container.replaceChildren();
  for (const { team, packages } of teams) {
    const chip = el("button", {
      type: "button",
      class: `team-chip${litTeams.has(team) ? " lit" : ""}`,
      "data-team": team,
      "aria-pressed": String(selectedTeam === team),
    });
    chip.append(el("span", { class: "team-name" }, shortTeam(team)), el("span", { class: "team-count", "aria-label": `${packages.length} packages` }, String(packages.length)));
    chip.addEventListener("click", () => onPickTeam(team));
    container.append(chip);
  }
}

function violationNote(v) {
  const note = el("p", { class: "violation" });
  note.append(el("strong", {}, `${v.file}:${v.line}`), document.createTextNode(v.message));
  return note;
}

function renderDetail(container, data, selectedPackage, selectedTeam) {
  container.replaceChildren();
  if (selectedPackage) {
    const pkg = data.packages.find((p) => p.name === selectedPackage);
    const rebuilds = transitiveDependents(data.packages, pkg.name).length + 1;
    container.append(
      el("h3", {}, shortName(pkg.name)),
      el("p", { class: "muted" }, `${pkg.dir}, ${pkg.kind === "app" ? "an app owned by one team" : "a shared package every consuming team approves"}`),
      el("p", { "data-approvers": "" }, `Approvals needed from ${pkg.owners.map(shortTeam).join(", ") || "nobody, a CODEOWNERS gap"}.`),
      el("p", {}, `A change here rebuilds ${rebuilds} of ${data.packages.length} packages.`)
    );
    for (const v of data.boundaryViolations.filter((x) => x.from === pkg.name || x.to === pkg.name)) container.append(violationNote(v));
    return;
  }
  if (selectedTeam) {
    const entry = data.teams.find((t) => t.team === selectedTeam);
    container.append(el("h3", {}, shortTeam(selectedTeam)), el("p", {}, `Must approve any change to these ${entry.packages.length} packages:`));
    const list = el("ul", { class: "plain" });
    for (const name of entry.packages) list.append(el("li", {}, shortName(name)));
    container.append(list);
    return;
  }
  container.append(el("p", { class: "muted" }, "Pick a package in the graph, or a team above it, to see who signs off on what."));
}

export function renderOwnership(root, { data, run, selectedPackage, selectedTeam, onSelect, onPickTeam }) {
  const lit = highlight(data.packages, { selectedPackage, selectedTeam });
  renderChips(root.querySelector("[data-teams]"), data.teams, lit.teams, selectedTeam, onPickTeam);

  const svg = root.querySelector("[data-graph]");
  svg.replaceChildren();
  const { positions, height } = layout(data.packages, { width: W, nodeWidth: NODE_W });
  svg.setAttribute("viewBox", `0 -36 ${W} ${height + 36}`);

  const defs = el("svg:defs");
  const marker = el("svg:marker", { id: "violation-head", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" });
  marker.append(el("svg:path", { d: "M0,0 L10,5 L0,10 z", class: "violation-head" }));
  defs.append(marker);
  svg.append(defs);

  // dependency links first, so cards paint over them
  const portMap = ports(data.packages, positions);
  for (const pkg of data.packages) {
    for (const dep of pkg.dependencies) {
      const both = lit.packages.has(pkg.name) && lit.packages.has(dep);
      const d = linkPath(positions.get(pkg.name), positions.get(dep), portMap.get(`${pkg.name}>${dep}`));
      svg.append(el("svg:path", { class: `edge${both ? " lit" : ""}`, "data-from": pkg.name, "data-to": dep, d }));
    }
  }
  for (const v of data.boundaryViolations) {
    if (!v.from || !v.to) continue;
    const path = el("svg:path", { class: "edge violation", "data-from": v.from, "data-to": v.to, d: linkPath(positions.get(v.from), positions.get(v.to)), "marker-end": "url(#violation-head)" });
    path.append(el("svg:title", {}, `${v.file}:${v.line} ${v.message}`));
    svg.append(path);
  }

  for (const pkg of data.packages) {
    const { x, y } = positions.get(pkg.name);
    const status = statusFor(run, pkg.name);
    const classes = ["node", `k-${pkg.kind}`];
    if (selectedPackage === pkg.name) classes.push("selected");
    if (lit.active) classes.push(lit.packages.has(pkg.name) ? "lit" : "dim");
    const owners = pkg.owners.map(shortTeam).join(", ") || "no owner";
    const g = el("svg:g", {
      class: classes.join(" "),
      transform: `translate(${x},${y})`,
      tabindex: "0",
      role: "button",
      "data-package": pkg.name,
      "aria-pressed": String(selectedPackage === pkg.name),
      "aria-label": `${pkg.name}, owned by ${owners}, ${STATUS_WORD[status]}`,
    });
    g.append(
      el("svg:rect", { class: "body", width: NODE_W, height: NODE_H, rx: 12 }),
      el("svg:text", { class: "name", x: 14, y: 26 }, shortName(pkg.name)),
      el("svg:text", { class: "meta", x: 14, y: 44 }, pkg.owners.length > 1 ? `${pkg.owners.length} teams` : shortTeam(pkg.owners[0] ?? "no owner")),
      el("svg:rect", { class: `pill s-${status}`, x: 14, y: 50, width: PILL[status], height: 18, rx: 9 }),
      el("svg:text", { class: "pill-text", x: 14 + PILL[status] / 2, y: 63.5, "text-anchor": "middle" }, STATUS_WORD[status])
    );
    const toggle = () => onSelect(pkg.name);
    g.addEventListener("click", toggle);
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
    svg.append(g);
  }

  const summary = root.querySelector("[data-violations]");
  summary.replaceChildren();
  const found = data.boundaryViolations;
  if (found.length === 0) {
    summary.append(el("p", { class: "ok" }, "No boundary violations. Every import respects the Lesson 1 rule."));
  } else {
    summary.append(el("p", { class: "warn" }, `${found.length} boundary violation${found.length === 1 ? "" : "s"}, drawn as dashed links. pnpm lint will fail.`));
    for (const v of found) summary.append(violationNote(v));
  }

  renderDetail(root.querySelector("[data-detail]"), data, selectedPackage, selectedTeam);
}
