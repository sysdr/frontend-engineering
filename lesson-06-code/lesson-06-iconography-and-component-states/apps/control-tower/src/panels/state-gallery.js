// Lesson 6: the State gallery. Every interactive primitive in all five
// states, side by side, plus a live one to try. Hover, Focus and Active are
// pinned with data-state, which the CSS draws with the very rule the real
// pseudo-class uses. Each row checks that its five states look different.
import { STATES, createButton, createFormField, sameLooking, stateSignature, updateBadge } from "@pulse/design-system";
import { badge, h, panelHead } from "../lib/dom.js";

const NAMES = { default: "Default", hover: "Hover", focus: "Focus", active: "Active", disabled: "Disabled" };

/**
 * @typedef {{ disabled?: boolean, state?: "hover" | "focus" | "active", onClick?: (e: MouseEvent) => void }} SpecimenOptions
 * @typedef {{ key: string, name: string, note: string, make: (o: SpecimenOptions) => HTMLElement, target: (el: HTMLElement) => HTMLElement }} Row
 */

/** @type {Row[]} */
const ROWS = [
  { key: "button-primary", name: "Button", note: "primary", make: (o) => createButton({ label: "Rebuild", icon: "refresh", ...o }), target: (el) => el },
  {
    key: "button-secondary",
    name: "Button",
    note: "secondary",
    make: (o) => createButton({ label: "Spacing overlay", icon: "grid", variant: "secondary", ...o }),
    target: (el) => el,
  },
  {
    key: "field",
    name: "FormField",
    note: "text input",
    make: ({ disabled, state }) => createFormField({ label: "Invoice amount (USD)", value: "1,284.00", disabled, state }),
    target: (el) => /** @type {HTMLElement} */ (el.querySelector("input")),
  },
];

/** @param {string} s */
const cap = (s) => NAMES[/** @type {keyof typeof NAMES} */ (s)] ?? s;

/** @param {HTMLElement} panel */
export async function mountStateGallery(panel) {
  const log = h("p", { class: "pulse-text-caption pulse-muted", "data-gallery-log": "", "aria-live": "polite" }, "Nothing pressed yet.");
  const status = badge("neutral", "Checking", { "data-gallery-status": "" });

  const rows = ROWS.map((row) => {
    /** @type {Record<string, HTMLElement>} */
    const specimens = {};
    const cells = STATES.map((state) => {
      const el = row.make(state === "disabled" ? { disabled: true } : state === "default" ? {} : { state: /** @type {"hover"} */ (state) });
      specimens[state] = el;
      // Pinned specimens are for looking at: inert, so a stray hover or Tab can't change them.
      return h("td", { "data-state-cell": state, inert: true }, el);
    });
    const live = row.make({ onClick: () => (log.textContent = `Pressed the live ${row.note} ${row.name}.`) });
    if (row.key === "field") live.querySelector("input")?.addEventListener("input", () => (log.textContent = "Typing in the live FormField."));
    const check = badge("neutral", "Checking", { "data-gallery-check": row.key });
    const tr = h(
      "tr",
      { "data-gallery-row": row.key },
      h("th", { scope: "row" }, h("div", { class: "pulse-stack-1" }, h("span", { class: "pulse-text-body row-name" }, row.name), h("span", { class: "pulse-text-caption pulse-muted" }, row.note), check)),
      ...cells,
      h("td", { class: "live", "data-state-cell": "live" }, live),
    );
    return { row, specimens, live, check, tr };
  });

  panel.replaceChildren(
    panelHead("states-title", "State gallery", status),
    h("p", { class: "pulse-text-caption pulse-muted" }, "Every interactive primitive in all five states. The last column is live: hover it, Tab to it, press it, and it should match the column above."),
    h(
      "div",
      { class: "table-wrap" },
      h(
        "table",
        { class: "pulse-table state-gallery" },
        h("thead", {}, h("tr", {}, h("th", {}, "Primitive"), ...STATES.map((s) => h("th", {}, cap(s))), h("th", { class: "live" }, "Try it"))),
        h("tbody", {}, rows.map((r) => r.tr)),
      ),
    ),
    log,
  );

  /** Compare each row's five states as the browser draws them. */
  function refresh() {
    let failing = 0;
    for (const r of rows) {
      /** @type {Record<string, string>} */
      const sigs = {};
      for (const s of STATES) sigs[s] = stateSignature(r.row.target(r.specimens[s]));
      const same = sameLooking(sigs);
      failing += Number(same.length > 0);
      r.check.dataset.same = same.map((p) => p.join("=")).join(" ");
      updateBadge(r.check, same.length ? "danger" : "success", same.length ? `${cap(same[0][1])} looks like ${cap(same[0][0])}` : "5 distinct states");
    }
    updateBadge(status, failing ? "danger" : "success", failing ? `${failing} of ${rows.length} rows have look-alike states` : `${rows.length} of ${rows.length} rows distinct`);
  }

  await new Promise((r) => requestAnimationFrame(r));
  refresh();
  return { refresh };
}
