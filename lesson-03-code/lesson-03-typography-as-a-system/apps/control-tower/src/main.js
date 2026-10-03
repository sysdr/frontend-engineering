// The Pulse Control Tower. Plain DOM: one state object, one render() that
// redraws every panel from it (three since Lesson 3), and a push channel
// that swaps in new data whenever turbo, CODEOWNERS or the source changes.
import { TYPE_RATIO } from "@pulse/design-system";
import { isNewRun, runCounts } from "./lib/graph.js";
import { connectLive } from "./lib/live.js";
import { renderBuildBoard } from "./panels/build-board.js";
import { renderOwnership } from "./panels/ownership-graph.js";
import { renderTypeScale } from "./panels/type-scale.js";

const state = { data: null, runIndex: -1, selectedPackage: null, selectedTeam: null, fresh: false, updates: 0, compareRatio: TYPE_RATIO };

const board = document.querySelector("[data-panel=build-board]");
const ownership = document.querySelector("[data-panel=ownership]");
const typePanel = document.querySelector("[data-panel=type-scale]");
const liveBadge = document.querySelector("[data-live]");
const announcer = document.querySelector("[data-announce]");

const actions = {
  onSelect(name) {
    state.selectedPackage = state.selectedPackage === name ? null : name;
    state.selectedTeam = null;
    render();
  },
  onPickTeam(team) {
    state.selectedTeam = state.selectedTeam === team ? null : team;
    state.selectedPackage = null;
    render();
  },
  onPickRun(index) {
    state.runIndex = index;
    render();
  },
  onPickRatio(ratio) {
    state.compareRatio = ratio;
    render();
  },
};

function render() {
  const run = state.data.runs[state.runIndex] ?? null;
  renderBuildBoard(board, { ...state, ...actions });
  renderOwnership(ownership, { ...state, run, ...actions });
  renderTypeScale(typePanel, { ...state, ...actions });
  document.body.dataset.updates = String(state.updates);
}

function applySnapshot(data) {
  const shownRun = state.data?.runs[state.runIndex];
  const latestRun = data.runs.at(-1);
  const arrived = state.data !== null && isNewRun(state.data.runs.at(-1), latestRun);
  state.data = data;
  if (arrived || !shownRun) state.runIndex = data.runs.length - 1;
  else state.runIndex = Math.max(0, data.runs.findIndex((r) => r.id === shownRun.id));
  if (state.selectedPackage && !data.packages.some((p) => p.name === state.selectedPackage)) state.selectedPackage = null;
  state.fresh = arrived;
  state.updates += 1;
  render();
  if (arrived) {
    const c = runCounts(latestRun);
    announcer.textContent = `New build: ${c.cached} of ${c.total} from cache, ${c.miss} rebuilt.`;
    setTimeout(() => {
      state.fresh = false;
      for (const strip of board.querySelectorAll(".strip.fresh")) strip.classList.remove("fresh");
    }, 2400);
  }
}

function setLive(status) {
  liveBadge.dataset.state = status;
  liveBadge.textContent = status === "live" ? "Live, watching turbo" : "Reconnecting to the tower server";
}

async function start() {
  const res = await fetch("/api/tower", { cache: "no-store" });
  if (!res.ok) throw new Error(`/api/tower answered ${res.status}`);
  applySnapshot(await res.json());
  connectLive("/api/events", { onSnapshot: applySnapshot, onStatus: setLive });
}

start().catch((err) => {
  setLive("reconnecting");
  board.querySelector("[data-run-sentence]").textContent =
    `The dashboard could not load its data (${err.message}). Start it with pnpm dev and open http://localhost:4100.`;
});
