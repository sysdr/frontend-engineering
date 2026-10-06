// Carried forward from Lesson 2: the CODEOWNERS graph. Apps on the left,
// shared packages on the right, edges are real package.json dependencies.
// Click a node (or focus it and press Enter) to light up its team.
import { getJson, h, panelHead, s } from "../lib/dom.js";

const W = 480;
const NODE_W = 176;
const NODE_H = 32;
const ROW = 48;

/** @param {HTMLElement} panel */
export async function mountOwnershipGraph(panel) {
  /** @type {{ name: string, dir: string, kind: string, deps: string[], owner: string | null }[]} */
  const pkgs = await getJson("/api/owners");
  const columns = [pkgs.filter((p) => p.kind === "app"), pkgs.filter((p) => p.kind === "package")];
  const height = Math.max(...columns.map((c) => c.length)) * ROW - (ROW - NODE_H) + 8;
  /** @type {Map<string, { x: number, y: number }>} */
  const pos = new Map();
  columns.forEach((col, c) => col.forEach((p, i) => pos.set(p.name, { x: c === 0 ? 4 : W - NODE_W - 48, y: 4 + i * ROW })));

  const svg = s("svg", { viewBox: `0 0 ${W} ${height}`, class: "graph", role: "group", "aria-label": "Package ownership graph" });
  for (const p of pkgs) {
    const a = pos.get(p.name);
    for (const dep of p.deps) {
      const b = pos.get(dep);
      if (!a || !b) continue;
      // Package-to-package edges loop round the right-hand side instead of cutting through nodes.
      const path =
        a.x === b.x
          ? `M${a.x + NODE_W} ${a.y + NODE_H / 2} C${a.x + NODE_W + 40} ${a.y + NODE_H / 2} ${b.x + NODE_W + 40} ${b.y + NODE_H / 2} ${b.x + NODE_W} ${b.y + NODE_H / 2}`
          : `M${a.x + NODE_W} ${a.y + NODE_H / 2} L${b.x} ${b.y + NODE_H / 2}`;
      svg.append(s("path", { class: "edge", d: path, fill: "none", "data-from": p.name, "data-to": dep }));
    }
  }
  const detail = h("p", { class: "pulse-text-caption", "data-owner-detail": "", "aria-live": "polite" }, "Select a package to see everything its team owns.");
  /** @type {Map<string, SVGGElement>} */
  const nodes = new Map();
  /** @param {string} name */
  const select = (name) => {
    const owner = pkgs.find((p) => p.name === name)?.owner ?? null;
    const team = pkgs.filter((p) => p.owner === owner).map((p) => p.name);
    for (const [n, g] of nodes) {
      g.classList.toggle("is-team", team.includes(n));
      g.classList.toggle("is-selected", n === name);
      g.setAttribute("aria-pressed", String(n === name));
    }
    detail.textContent = `${owner ?? "No owner"} owns ${team.join(", ")}.`;
  };
  for (const p of pkgs) {
    const { x, y } = /** @type {{ x: number, y: number }} */ (pos.get(p.name));
    const g = /** @type {SVGGElement} */ (
      s(
        "g",
        {
          class: "node",
          tabindex: 0,
          role: "button",
          "aria-pressed": "false",
          "aria-label": `${p.name}, owned by ${p.owner ?? "nobody"}`,
          "data-node": p.name,
          transform: `translate(${x} ${y})`,
          onclick: () => select(p.name),
          onkeydown: (/** @type {KeyboardEvent} */ e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              select(p.name);
            }
          },
        },
        s("rect", { width: NODE_W, height: NODE_H, rx: 8 }),
        s("text", { x: NODE_W / 2, y: NODE_H / 2, class: "node-label", "text-anchor": "middle", "dominant-baseline": "central" }, p.name),
      )
    );
    nodes.set(p.name, g);
    svg.append(g);
  }
  panel.replaceChildren(
    panelHead("owners-title", "Ownership"),
    h("p", { class: "pulse-text-caption pulse-muted" }, "Apps on the left, shared packages on the right. Lines are real dependencies."),
    h("div", { class: "graph-wrap" }, svg),
    detail,
  );
}
