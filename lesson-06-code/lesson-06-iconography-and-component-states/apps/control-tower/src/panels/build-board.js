// Carried forward from Lesson 2: one card per package, from turbo's own run
// summary. Lesson 6 gives each card the package and team icons, and the panel
// a Refresh button that is disabled while it fetches.
import { createButton, createIcon } from "@pulse/design-system";
import { badge, getJson, h, panelHead } from "../lib/dom.js";
import { onLive } from "../lib/live.js";

const TONE = { hit: "success", miss: "warning", failed: "danger", never: "neutral" };
const LABEL = { hit: "Cache hit", miss: "Cache miss", failed: "Failed", never: "Not built" };

/** @param {any} p */
function card(p) {
  const status = /** @type {keyof typeof TONE} */ (p.lastStatus);
  return h(
    "article",
    { class: "card pulse-stack-1", "data-package": p.name, "data-status": status },
    h("h3", { class: "card-name pulse-text-body" }, createIcon("package"), h("span", {}, p.name)),
    h("p", { class: "card-owner pulse-text-caption pulse-muted" }, createIcon("users"), h("span", {}, p.owner ?? "No owner")),
    h(
      "div",
      { class: "pulse-cluster-1" },
      badge(TONE[status], LABEL[status]),
      p.lastMs == null ? null : h("span", { class: "pulse-text-caption pulse-muted" }, `${p.lastMs} ms`),
    ),
  );
}

/** @param {HTMLElement} panel */
export async function mountBuildBoard(panel) {
  const summary = h("p", { class: "pulse-text-caption pulse-muted", "data-build-summary": "" });
  const cards = h("div", { class: "cards" });

  /** @param {{ at: number | null, packages: any[] }} data */
  const render = (data) => {
    const hits = data.packages.filter((p) => p.lastStatus === "hit").length;
    summary.textContent = data.at
      ? `Last pnpm build: ${hits} of ${data.packages.length} packages from cache, finished ${new Date(data.at).toLocaleTimeString()}.`
      : "No build yet. Run pnpm build and these cards fill in.";
    cards.replaceChildren(...data.packages.map(card));
  };
  const refresh = createButton({
    label: "Refresh",
    icon: "refresh",
    variant: "secondary",
    onClick: async () => {
      refresh.disabled = true;
      try {
        render(await getJson("/api/build"));
      } finally {
        refresh.disabled = false;
      }
    },
  });
  refresh.dataset.buildRefresh = "";
  panel.replaceChildren(panelHead("build-title", "Build status", refresh), summary, cards);
  render(await getJson("/api/build"));
  onLive("build", render);
}
