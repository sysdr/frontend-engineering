// Lesson 5: the Spacing panel. The scale drawn at its real sizes and measured
// as rendered, the board's grid measured live, and the overlay's audit: how
// many spaces on this page sit on the 8px grid, and which ones do not.
import { BASE_UNIT_PX, labelText, spaceScale, spaceVar, stepFor, updateBadge } from "@pulse/design-system";
import { badge, h, panelHead } from "../lib/dom.js";

const KIND_LABEL = { padding: "Padding", margin: "Margin", gap: "Gap" };

/** @param {HTMLElement} panel @param {import("@pulse/design-system").SpacingOverlay} overlay */
export async function mountSpacingPanel(panel, overlay) {
  const status = badge("neutral", "Measuring", { "data-spacing-status": "" });

  // 1. The scale, each bar exactly as wide as its step.
  const steps = spaceScale.map((step) => {
    const bar = h("span", { class: "space-bar", style: `width: var(${spaceVar(step.multiple)})`, "data-step": step.name });
    const measured = h("td", { class: "num" });
    const result = h("td");
    const row = h(
      "tr",
      {},
      h("th", { scope: "row" }, h("code", {}, step.name)),
      h("td", { class: "num" }, `${step.multiple} × ${BASE_UNIT_PX}`),
      h("td", {}, bar),
      measured,
      result,
    );
    return { step, bar, measured, result, row };
  });
  const scale = h(
    "div",
    { class: "table-wrap" },
    h(
      "table",
      { class: "pulse-table", "data-spacing-scale": "" },
      h("thead", {}, h("tr", {}, h("th", {}, "Step"), h("th", { class: "num" }, "Units"), h("th", {}, "Drawn"), h("th", { class: "num" }, "Measured"), h("th", {}, "Check"))),
      h("tbody", {}, steps.map((s) => s.row)),
    ),
  );

  // 2. The board's grid, read back from the rendered page.
  const facts = h("dl", { class: "facts", "data-grid-facts": "" });
  const fact = (/** @type {string} */ key, /** @type {string} */ label) =>
    h("div", { class: "fact pulse-stack-1", "data-fact": key }, h("dt", { class: "pulse-text-caption pulse-muted" }, label), h("dd", { class: "pulse-text-heading" }), h("dd", { class: "pulse-text-caption pulse-muted" }));
  facts.append(fact("columns", "Columns"), fact("gutter", "Gutter"), fact("page-margin", "Page margin"), fact("panel-padding", "Panel padding"));

  // 3. The audit the overlay draws.
  const counts = h("p", { class: "pulse-text-caption", "data-spacing-counts": "" });
  const offList = h("ul", { class: "offgrid pulse-stack-1", "data-offgrid-list": "" });
  const legend = h(
    "p",
    { class: "legend pulse-cluster-2 pulse-text-caption pulse-muted" },
    ...["padding", "margin", "gap"].map((kind) =>
      h("span", { class: "pulse-cluster-1" }, h("span", { class: "pulse-spacing-label is-static", "data-kind": kind }, "24"), KIND_LABEL[/** @type {"padding"} */ (kind)]),
    ),
    h("span", { class: "pulse-cluster-1" }, h("span", { class: "pulse-spacing-label is-static", "data-kind": "margin", "data-status": "off-grid" }, "16.6"), "Off the grid"),
  );

  panel.replaceChildren(
    panelHead("spacing-title", "Spacing", status),
    h("p", { class: "pulse-text-caption pulse-muted" }, "Every space is a whole number of 8px units. Turn on the spacing overlay to see each one measured on the page."),
    scale,
    facts,
    h("div", { class: "audit pulse-stack-1" }, counts, legend, offList),
  );

  const board = /** @type {HTMLElement} */ (document.querySelector(".board"));
  /** @param {string} key @param {string} value @param {string} note */
  const setFact = (key, value, note) => {
    const [dd, small] = /** @type {NodeListOf<HTMLElement>} */ (facts.querySelectorAll(`[data-fact="${key}"] dd`));
    if (dd.textContent !== value) dd.textContent = value;
    if (small.textContent !== note) small.textContent = note;
  };
  /** A measured layout role: its value and the step it resolves to at this width. @param {string} key @param {string} css */
  const setRole = (key, css) => {
    const v = Math.round(Number.parseFloat(css) * 100) / 100;
    setFact(key, `${v}px`, `role ${key}, ${stepFor(v)?.name ?? "not a step"}`);
  };

  function measureStatic() {
    for (const s of steps) {
      const w = Math.round(s.bar.getBoundingClientRect().width * 100) / 100;
      const ok = w === s.step.px;
      const text = `${w}px`;
      if (s.measured.textContent !== text) s.measured.textContent = text;
      if (s.result.dataset.ok !== String(ok)) {
        s.result.dataset.ok = String(ok);
        s.result.replaceChildren(badge(ok ? "success" : "danger", ok ? "Matches" : `Expected ${s.step.px}px`));
      }
    }
    const b = getComputedStyle(board);
    setFact("columns", String(b.gridTemplateColumns.split(/\s+/).length), "equal tracks on the board");
    setRole("gutter", b.columnGap);
    setRole("page-margin", b.paddingLeft);
    setRole("panel-padding", getComputedStyle(panel).paddingLeft);
  }

  overlay.subscribe(({ summary }) => {
    const off = summary.offGrid.length;
    updateBadge(status, off ? "danger" : "success", off ? `${off} off the grid` : `All ${summary.total} on the 8px grid`);
    counts.textContent =
      `${summary.total} spaces measured: ${summary.byKind.padding} paddings, ${summary.byKind.margin} margins, ` +
      `${summary.byKind.gap} gaps. ${summary.onGrid} on the grid, ${off} off it.`;
    counts.dataset.total = String(summary.total);
    counts.dataset.offGrid = String(off);
    offList.hidden = off === 0;
    offList.replaceChildren(
      ...summary.offGrid
        .slice(0, 6)
        .map((m) => h("li", { class: "pulse-cluster-1" }, h("code", {}, m.where), h("span", {}, `${m.kind}-${m.side}`), badge("danger", `${labelText(m)}px`))),
      ...(off > 6 ? [h("li", { class: "pulse-muted" }, `and ${off - 6} more`)] : []),
    );
  });

  let frame = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(measureStatic);
  });
  await new Promise((r) => requestAnimationFrame(r));
  measureStatic();
}
