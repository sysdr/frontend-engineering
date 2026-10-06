// Carried forward from Lesson 4: every declared colour pair drawn in both
// themes at once, measured from the rendered page, plus the live gate result.
import { AA, contrastRatio, formatRatio, pairs, updateBadge } from "@pulse/design-system";
import { badge, getJson, h, panelHead } from "../lib/dom.js";

const THEMES = /** @type {const} */ (["light", "dark"]);

/** @param {HTMLElement} panel */
export async function mountContrastAudit(panel) {
  const count = badge("neutral", "Measuring", { "data-contrast-count": "" });
  const gateBadge = badge("neutral", "Gate", { "data-contrast-gate": "" });
  const rows = pairs.map((p) => {
    const cells = THEMES.map((theme) => {
      const sample = h(
        "span",
        { class: `swatch${p.kind === "ui" ? " swatch--ui" : ""}`, "data-theme": theme, style: `--fg: var(--pulse-color-${p.fg}); --bg: var(--pulse-color-${p.bg})` },
        p.kind === "ui" ? "" : "Aa",
      );
      const ratio = h("span", { class: "pulse-text-caption num" });
      const result = h("span");
      return { theme, sample, ratio, result, td: h("td", {}, h("span", { class: "pulse-cluster-1" }, sample, ratio, result)) };
    });
    const row = h("tr", { "data-pair": `${p.fg}/${p.bg}` }, h("th", { scope: "row" }, p.use), h("td", {}, h("code", {}, `${p.fg} on ${p.bg}`)), ...cells.map((c) => c.td), h("td", { class: "num" }, `${AA[p.kind]}:1`));
    return { p, cells, row };
  });
  panel.replaceChildren(
    panelHead("contrast-title", "Contrast audit", count, gateBadge),
    h("p", { class: "pulse-text-caption pulse-muted" }, "Every colour pair the UI draws, in both themes at once, measured from the rendered page."),
    h(
      "div",
      { class: "table-wrap" },
      h(
        "table",
        { class: "pulse-table contrast-table" },
        h("thead", {}, h("tr", {}, h("th", {}, "Used for"), h("th", {}, "Roles"), h("th", {}, "Light"), h("th", {}, "Dark"), h("th", { class: "num" }, "Needs"))),
        h("tbody", {}, rows.map((r) => r.row)),
      ),
    ),
  );

  function measure() {
    let passing = 0;
    for (const r of rows) {
      for (const c of r.cells) {
        const cs = getComputedStyle(c.sample);
        const fg = r.p.kind === "ui" ? cs.borderTopColor : cs.color;
        const ratio = contrastRatio(fg, cs.backgroundColor);
        const pass = ratio >= AA[r.p.kind];
        passing += Number(pass);
        c.ratio.textContent = formatRatio(ratio);
        c.result.replaceChildren(badge(pass ? "success" : "danger", pass ? "Pass" : "Fail"));
        c.sample.closest("td")?.setAttribute("data-pass", String(pass));
      }
    }
    const total = rows.length * THEMES.length;
    updateBadge(count, passing === total ? "success" : "danger", `${passing} of ${total} pass`);
  }

  /** @param {{ failing: unknown[] }} gate */
  function showGate(gate) {
    updateBadge(gateBadge, gate.failing.length ? "danger" : "success", gate.failing.length ? `Gate failing (${gate.failing.length})` : "Gate passing");
  }

  await new Promise((r) => requestAnimationFrame(r));
  measure();
  showGate(await getJson("/api/contrast"));
  return {
    /** @param {{ failing: unknown[] }} gate */
    refresh(gate) {
      measure();
      showGate(gate);
    },
  };
}
