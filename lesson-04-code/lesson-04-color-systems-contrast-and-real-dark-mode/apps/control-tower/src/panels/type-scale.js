// Carried forward from Lesson 3 (compact): every type role rendered for real
// and measured with getComputedStyle against its token.
import { typeScale } from "@pulse/design-system";
import { h } from "../lib/dom.js";

/** @param {HTMLElement} root */
export async function mountTypeScale(root) {
  const list = h("ol", { class: "type-list" });
  root.replaceChildren(
    h("div", { class: "panel-head" }, h("h2", { id: "type-title", class: "pulse-text-heading" }, "Type scale")),
    h("p", { class: "pulse-muted pulse-text-caption" }, "Ratio 1.25 from 16px. Each specimen is measured as rendered."),
    list,
  );
  for (const step of typeScale) {
    const specimen = h("span", { class: `pulse-text-${step.role} specimen` }, "Overdue invoices");
    const measured = h("span", { class: "pulse-muted pulse-text-caption num" });
    const verdict = h("span", { class: "pulse-badge" });
    list.append(h("li", { "data-specimen": step.role }, h("span", { class: "role pulse-text-caption" }, step.role), specimen, measured, verdict));
    const cs = getComputedStyle(specimen);
    const size = parseFloat(cs.fontSize);
    const line = parseFloat(cs.lineHeight);
    const ok = Math.abs(size - step.sizePx) < 0.05 && Math.abs(line - step.lineHeightPx) < 0.05;
    measured.textContent = `${+size.toFixed(2)}px / ${line}px`;
    verdict.textContent = ok ? "Matches" : "Differs";
    verdict.dataset.tone = ok ? "success" : "danger";
  }
}
