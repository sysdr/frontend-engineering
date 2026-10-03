// Carried forward from Lesson 2: one card per package from turbo's own run
// summary. Lesson 4 change: card states use status colour roles.
import { h } from "../lib/dom.js";
import { getJson, onLive } from "../lib/live.js";

const STATUS = {
  hit: ["success", "Cache hit"],
  miss: ["warning", "Cache miss"],
  failed: ["danger", "Failed"],
  never: [null, "Not built yet"],
};

/** @param {HTMLElement} root */
export async function mountBuildBoard(root) {
  const grid = h("ul", { class: "cards" });
  const when = h("span", { class: "pulse-muted pulse-text-caption", "data-build-at": "" });
  root.replaceChildren(h("div", { class: "panel-head" }, h("h2", { id: "build-title", class: "pulse-text-heading" }, "Build status"), when), grid);

  /** @param {{ at: number | null, packages: any[] }} data */
  function render(data) {
    when.textContent = data.at ? `Last pnpm build ${new Date(data.at).toLocaleTimeString()}` : "Run pnpm build to fill this in";
    grid.replaceChildren(
      ...data.packages.map((p) => {
        const [tone, label] = STATUS[/** @type {keyof typeof STATUS} */ (p.lastStatus)];
        return h(
          "li",
          { class: "card", "data-package": p.name, "data-status": p.lastStatus },
          h("span", { class: "card-name" }, p.name.replace("@pulse/", "")),
          h("span", { class: "pulse-muted pulse-text-caption" }, p.owner ?? "no owner"),
          h("span", { class: "card-foot" }, h("span", { class: "pulse-badge", "data-tone": tone }, label), h("span", { class: "pulse-muted pulse-text-caption num" }, p.lastMs == null ? "" : `${p.lastMs} ms`)),
        );
      }),
    );
  }

  render(await getJson("/api/build"));
  onLive("build", render);
}
