// Carried forward from Lesson 3: every type role, measured as rendered.
import { BASE_PX, typeScale } from "@pulse/design-system";
import { badge, h, panelHead } from "../lib/dom.js";

/** @param {HTMLElement} panel */
export async function mountTypeScale(panel) {
  const rows = typeScale.map((t) => {
    const sample = h("span", { class: `pulse-text-${t.role}` }, "Invoice 2041");
    const cells = { size: h("td", { class: "num" }), line: h("td", { class: "num" }), check: h("td") };
    return { t, sample, cells, row: h("tr", { "data-role": t.role }, h("th", { scope: "row" }, h("code", {}, t.role)), h("td", { class: "sample" }, sample), cells.size, cells.line, cells.check) };
  });
  panel.replaceChildren(
    panelHead("type-title", "Type scale"),
    h("p", { class: "pulse-text-caption pulse-muted" }, `Base ${BASE_PX}px, ratio 1.25. Each role measured as the browser renders it.`),
    h(
      "div",
      { class: "table-wrap" },
      h(
        "table",
        { class: "pulse-table" },
        h("thead", {}, h("tr", {}, h("th", {}, "Role"), h("th", {}, "Sample"), h("th", { class: "num" }, "Size"), h("th", { class: "num" }, "Line"), h("th", {}, "Check"))),
        h("tbody", {}, rows.map((r) => r.row)),
      ),
    ),
  );
  await new Promise((r) => requestAnimationFrame(r));
  for (const r of rows) {
    const cs = getComputedStyle(r.sample);
    const size = Number.parseFloat(cs.fontSize);
    const line = Number.parseFloat(cs.lineHeight);
    r.cells.size.textContent = `${+size.toFixed(2)}px`;
    r.cells.line.textContent = `${+line.toFixed(2)}px`;
    const ok = Math.abs(size - r.t.sizePx) < 0.01 && Math.abs(line - r.t.lineHeightPx) < 0.01;
    r.cells.check.append(badge(ok ? "success" : "danger", ok ? "Matches" : "Drifted"));
  }
}
