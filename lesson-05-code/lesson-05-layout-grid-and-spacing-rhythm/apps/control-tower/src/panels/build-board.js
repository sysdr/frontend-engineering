// Carried forward from Lesson 2: one card per package, from turbo's own run
// summary. Lesson 5 lays the cards out on the spacing scale.
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
    h("h3", { class: "card-name pulse-text-body" }, p.name),
    h("p", { class: "pulse-text-caption pulse-muted" }, p.owner ?? "No owner"),
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
  panel.replaceChildren(panelHead("build-title", "Build status"), summary, cards);

  /** @param {{ at: number | null, packages: any[] }} data */
  const render = (data) => {
    const hits = data.packages.filter((p) => p.lastStatus === "hit").length;
    summary.textContent = data.at
      ? `Last pnpm build: ${hits} of ${data.packages.length} packages from cache, finished ${new Date(data.at).toLocaleTimeString()}.`
      : "No build yet. Run pnpm build and these cards fill in.";
    cards.replaceChildren(...data.packages.map(card));
  };
  render(await getJson("/api/build"));
  onLive("build", render);
}
