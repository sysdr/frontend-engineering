// @vitest-environment jsdom
// Renders both panels into the real index.html markup, from a snapshot the
// collector captured from this repo (fixtures/control-tower/tower-snapshot.json),
// and clicks through them the way a person would.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, it, expect } from "vitest";
import { renderBuildBoard } from "../apps/control-tower/src/panels/build-board.js";
import { renderOwnership, ports, linkPath } from "../apps/control-tower/src/panels/ownership-graph.js";
import { layout } from "../apps/control-tower/src/lib/graph.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(ROOT, "apps", "control-tower", "src", "index.html"), "utf-8");
const snapshot = JSON.parse(readFileSync(join(ROOT, "fixtures", "control-tower", "tower-snapshot.json"), "utf-8"));

function mount(data, initial = {}) {
  document.documentElement.innerHTML = html.replace(/^<!doctype html>/i, "");
  const state = { data, runIndex: data.runs.length - 1, selectedPackage: null, selectedTeam: null, fresh: false, ...initial };
  const board = document.querySelector("[data-panel=build-board]");
  const ownership = document.querySelector("[data-panel=ownership]");
  const actions = {
    onSelect: (name) => { state.selectedPackage = state.selectedPackage === name ? null : name; state.selectedTeam = null; render(); },
    onPickTeam: (team) => { state.selectedTeam = state.selectedTeam === team ? null : team; state.selectedPackage = null; render(); },
    onPickRun: (i) => { state.runIndex = i; render(); },
  };
  function render() {
    renderBuildBoard(board, { ...state, ...actions });
    renderOwnership(ownership, { ...state, run: state.data.runs[state.runIndex], ...actions });
  }
  render();
  return state;
}

const strips = () => [...document.querySelectorAll(".strip")];
const node = (name) => document.querySelector(`g.node[data-package="${name}"]`);

describe("build board", () => {
  beforeEach(() => mount(snapshot));

  it("draws one coloured strip per package, matching the latest run", () => {
    const latest = snapshot.runs.at(-1);
    expect(strips()).toHaveLength(8);
    for (const strip of strips()) {
      const task = latest.tasks.find((t) => t.package === strip.dataset.package);
      const expected = task.status === "MISS" ? "miss" : task.source === "REMOTE" ? "hit-remote" : "hit-local";
      expect(strip.dataset.status).toBe(expected);
      expect(strip.classList.contains(`s-${expected}`)).toBe(true);
    }
  });

  it("re-colours every strip when you pick an older run", () => {
    const firstRunMisses = snapshot.runs[0].tasks.filter((t) => t.status === "MISS").length;
    document.querySelectorAll(".run")[0].click();
    expect(strips().filter((s) => s.dataset.status === "miss")).toHaveLength(firstRunMisses);
    expect(document.querySelectorAll(".run")[0].getAttribute("aria-pressed")).toBe("true");
  });
});

describe("ownership graph", () => {
  beforeEach(() => mount(snapshot));

  it("draws a node per package and a link per declared dependency", () => {
    const links = snapshot.packages.reduce((n, p) => n + p.dependencies.length, 0);
    expect(document.querySelectorAll("g.node")).toHaveLength(8);
    expect(document.querySelectorAll("path.edge:not(.violation)")).toHaveLength(links);
  });

  it("clicking billing highlights its real CODEOWNERS team", () => {
    node("@pulse/billing").dispatchEvent(new Event("click"));
    const litChips = [...document.querySelectorAll(".team-chip.lit")].map((c) => c.dataset.team);
    expect(litChips).toEqual(["@pulse/billing-team"]);
    expect(document.querySelector("[data-approvers]").textContent).toBe("Approvals needed from billing-team.");
    expect(node("@pulse/shell").classList.contains("dim")).toBe(true);
    expect(node("@pulse/contracts").classList.contains("lit")).toBe(true);
  });

  it("Enter on a focused node selects it, like a click", () => {
    node("@pulse/admin").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(node("@pulse/admin").getAttribute("aria-pressed")).toBe("true");
  });

  it("clicking a team chip lights only the packages that team owns", () => {
    document.querySelector('.team-chip[data-team="@pulse/platform-team"]').click();
    const lit = [...document.querySelectorAll("g.node.lit")].map((n) => n.dataset.package).sort();
    expect(lit).toEqual(["@pulse/config", "@pulse/contracts", "@pulse/control-tower", "@pulse/design-system", "@pulse/shell"]);
  });

  it("spreads links across a card instead of stacking them on one point", () => {
    const { positions } = layout(snapshot.packages, { width: 880, nodeWidth: 172 });
    const map = ports(snapshot.packages, positions);
    const arrivals = snapshot.packages
      .find((p) => p.name === "@pulse/design-system")
      .dependents.map((d) => map.get(`${d}>@pulse/design-system`).toX);
    expect(new Set(arrivals).size).toBe(arrivals.length);
    expect(linkPath({ x: 0, y: 0 }, { x: 0, y: 118 }, { fromX: 40, toX: 90 })).toBe("M40,72 C40,94 90,94 90,116");
  });

  it("draws a boundary violation as a dashed link between the two real nodes", () => {
    const withViolation = structuredClone(snapshot);
    withViolation.boundaryViolations = [{
      file: "apps/analytics/src/index.js", line: 10, kind: "appToApp",
      message: "apps/analytics is an app and may not import another app (apps/billing).",
      from: "@pulse/analytics", to: "@pulse/billing",
    }];
    mount(withViolation);
    const link = document.querySelector("path.edge.violation");
    expect(link.getAttribute("data-from")).toBe("@pulse/analytics");
    expect(link.getAttribute("data-to")).toBe("@pulse/billing");
    expect(document.querySelector("[data-violations] .warn").textContent).toMatch(/^1 boundary violation/);
  });
});
