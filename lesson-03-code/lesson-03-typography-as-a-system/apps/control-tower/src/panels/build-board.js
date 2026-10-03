// Panel 1 — the build board. One strip per package, coloured by what turbo
// actually did for it in the selected run, like the paper flight strips a
// tower controller slides along a rack: a glance says who is moving.
import { el } from "../lib/dom.js";
import { formatMs, runCounts, shortName, shortTeam, statusFor } from "../lib/graph.js";

export const STATUS_WORD = {
  miss: "Rebuilt",
  "hit-local": "Cached here",
  "hit-remote": "Cached, remote",
  "not-run": "Not in this run",
};

function ownerLabel(owners) {
  if (owners.length === 0) return "No owner";
  return owners.length === 1 ? shortTeam(owners[0]) : `${owners.length} teams`;
}

// turbo reports how long the original build took as timeSaved; artifacts
// restored from a remote cache can carry 0 there, so say what we know.
function cacheNote(task) {
  return task.timeSavedMs > 0 ? `saved ${formatMs(task.timeSavedMs)}` : "restored from cache";
}

export function runSentence(run) {
  if (!run) return "No builds recorded yet. Run pnpm build and this board fills in by itself.";
  const c = runCounts(run);
  const when = new Date(run.endTime).toLocaleTimeString();
  const rebuilt = c.miss === 0 ? "nothing rebuilt" : `${c.miss} rebuilt`;
  return `${c.cached} of ${c.total} packages came from cache, ${rebuilt}. Took ${formatMs(run.durationMs)}, finished ${when}.`;
}

function renderRunStrip(container, runs, runIndex, onPickRun) {
  container.replaceChildren();
  runs.forEach((run, i) => {
    const c = runCounts(run);
    const btn = el("button", {
      type: "button",
      class: "run",
      "aria-pressed": String(i === runIndex),
      "aria-label": `Run ${i + 1}: ${c.cached} of ${c.total} cached, ${c["hit-remote"]} from remote, ${c.miss} rebuilt`,
    });
    const bar = el("span", { class: "bar", "aria-hidden": "true" });
    for (const key of ["hit-local", "hit-remote", "miss"]) {
      if (c[key] === 0) continue;
      const seg = el("span", { class: `seg s-${key}` });
      seg.style.height = `${(c[key] / c.total) * 100}%`;
      bar.append(seg);
    }
    btn.append(bar, el("span", { class: "run-count" }, `${c.cached}/${c.total}`));
    btn.addEventListener("click", () => onPickRun(i));
    container.append(btn);
  });
}

export function renderBuildBoard(root, { data, runIndex, selectedPackage, fresh, onSelect, onPickRun }) {
  const run = data.runs[runIndex] ?? null;
  root.querySelector("[data-run-sentence]").textContent = runSentence(run);
  root.dataset.runId = run?.id ?? "";
  renderRunStrip(root.querySelector("[data-run-strip]"), data.runs, runIndex, onPickRun);

  const list = root.querySelector("[data-strips]");
  list.replaceChildren();
  const ordered = [...data.packages].sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
  for (const pkg of ordered) {
    const status = statusFor(run, pkg.name);
    const task = run?.tasks.find((t) => t.package === pkg.name);
    const time = status === "miss" ? formatMs(task.durationMs) : status === "not-run" ? "" : cacheNote(task);
    const strip = el("button", {
      type: "button",
      class: `strip s-${status}${fresh ? " fresh" : ""}${selectedPackage === pkg.name ? " selected" : ""}`,
      "data-package": pkg.name,
      "data-status": status,
      "aria-pressed": String(selectedPackage === pkg.name),
    });
    const who = el("span", { class: "who" });
    who.append(el("span", { class: "pkg" }, shortName(pkg.name)), el("span", { class: "dir" }, pkg.dir));
    const state = el("span", { class: "state" });
    state.append(el("span", { class: "word" }, STATUS_WORD[status]), el("span", { class: "time" }, time));
    strip.append(el("span", { class: "band", "aria-hidden": "true" }), who, el("span", { class: "owner" }, ownerLabel(pkg.owners)), state);
    strip.addEventListener("click", () => onSelect(pkg.name));
    const item = el("li");
    item.append(strip);
    list.append(item);
  }
}
