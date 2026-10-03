// Carried forward from Lesson 2: packages as a node-link diagram, edges are
// real dependencies, colour-free (roles only). Click or press Enter on a
// node to light up everything its CODEOWNERS team owns.
import { h, s } from "../lib/dom.js";
import { getJson } from "../lib/live.js";

const W = 440;
const NODE_W = 140;
const NODE_H = 36;
const ROW_GAP = 52;

/** @param {HTMLElement} root */
export async function mountOwnershipGraph(root) {
  const pkgs = await getJson("/api/owners");
  const detail = h("p", { class: "pulse-muted pulse-text-caption", "data-owner-detail": "", "aria-live": "polite" }, "Select a package to see its owning team.");
  // Apps in the left column, shared packages in the right; edges run left to right.
  const columns = [pkgs.filter((p) => p.kind === "app"), pkgs.filter((p) => p.kind === "package")];
  const height = Math.max(...columns.map((c) => c.length)) * ROW_GAP;
  const svg = s("svg", { viewBox: `0 0 ${W} ${height}`, class: "graph", role: "group", "aria-label": "Package ownership graph" });
  /** @type {Map<string, { x: number, y: number }>} */
  const pos = new Map();
  columns.forEach((col, c) => {
    col.forEach((p, i) => pos.set(p.name, { x: c === 0 ? 4 : W - NODE_W - 48, y: 8 + i * ROW_GAP }));
  });

  const edges = pkgs.flatMap((p) =>
    p.deps.filter((d) => pos.has(d)).map((d) => {
      const a = pos.get(p.name);
      const b = pos.get(d);
      // Package-to-package edges loop round the right-hand side instead of
      // cutting through the nodes between them.
      const sameColumn = a.x === b.x;
      const path = sameColumn
        ? `M${a.x + NODE_W} ${a.y + NODE_H / 2} C${a.x + NODE_W + 40} ${a.y + NODE_H / 2} ${b.x + NODE_W + 40} ${b.y + NODE_H / 2} ${b.x + NODE_W} ${b.y + NODE_H / 2}`
        : `M${a.x + NODE_W} ${a.y + NODE_H / 2} L${b.x} ${b.y + NODE_H / 2}`;
      const line = s("path", { class: "edge", d: path, fill: "none" });
      svg.append(line);
      return { from: p.name, to: d, line };
    }),
  );

  const nodes = pkgs.map((p) => {
    const { x, y } = pos.get(p.name);
    const g = s("g", { class: "node", transform: `translate(${x} ${y})`, tabindex: 0, role: "button", "data-node": p.name, "aria-pressed": "false" });
    const rect = s("rect", { width: NODE_W, height: NODE_H, rx: 10 });
    const label = s("text", { x: NODE_W / 2, y: NODE_H / 2, "text-anchor": "middle", "dominant-baseline": "central" });
    label.textContent = p.name.replace("@pulse/", "");
    g.append(rect, label);
    const select = () => choose(p);
    g.addEventListener("click", select);
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        select();
      }
    });
    svg.append(g);
    return { p, g };
  });

  /** @param {any} chosen */
  function choose(chosen) {
    for (const { p, g } of nodes) {
      g.classList.toggle("is-selected", p.name === chosen.name);
      g.classList.toggle("is-team", p.owner === chosen.owner);
      g.setAttribute("aria-pressed", String(p.name === chosen.name));
    }
    for (const e of edges) e.line.classList.toggle("is-active", e.from === chosen.name);
    const team = pkgs.filter((p) => p.owner === chosen.owner).map((p) => p.name.replace("@pulse/", ""));
    detail.textContent = `${chosen.name} is owned by ${chosen.owner}, who also own: ${team.join(", ")}.`;
    detail.dataset.owner = chosen.owner;
  }

  root.replaceChildren(h("div", { class: "panel-head" }, h("h2", { id: "owners-title", class: "pulse-text-heading" }, "Ownership")), h("div", { class: "graph-wrap" }, svg), detail);
}
