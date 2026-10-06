// The billing invoice list (carried forward from Lessons 3-5). Lesson 6: the
// status badges carry the set's check, alert and cross icons, so Paid, Due
// soon and Overdue differ in shape as well as colour.
import { browserThemeController, createBadge, createSpacingOverlay, mountSpacingToggle, mountThemeSwitcher } from "@pulse/design-system";
import { STATUS, formatDate, formatMoney, invoices, sortInvoices, totals } from "../index.js";

/** @param {string} sel */
const $ = (sel) => /** @type {HTMLElement} */ (document.querySelector(sel));

mountThemeSwitcher($("[data-theme-slot]"), browserThemeController());
mountSpacingToggle($("[data-overlay-slot]"), createSpacingOverlay());

const t = totals(invoices);
$("[data-totals]").textContent = `${invoices.length} invoices. ${formatMoney(t.paid)} paid, ${formatMoney(t.due)} due soon, ${formatMoney(t.overdue)} overdue.`;

/** @type {{ key: import("../index.js").SortKey, dir: "asc" | "desc" }} */
let sort = { key: "due", dir: "asc" };

function render() {
  const rows = sortInvoices(invoices, sort.key, sort.dir).map((inv) => {
    const tr = document.createElement("tr");
    const cells = [inv.id, inv.customer, formatDate(inv.issued), formatDate(inv.due), formatMoney(inv.cents)];
    cells.forEach((text, i) => {
      const td = document.createElement(i === 0 ? "th" : "td");
      if (i === 0) td.setAttribute("scope", "row");
      if (i === 4) td.className = "num";
      td.textContent = text;
      tr.append(td);
    });
    const status = document.createElement("td");
    status.append(createBadge({ tone: STATUS[inv.status].tone, text: STATUS[inv.status].label }));
    tr.append(status);
    return tr;
  });
  $("[data-rows]").replaceChildren(...rows);
  for (const btn of document.querySelectorAll("button.sort")) {
    const th = /** @type {HTMLElement} */ (btn.closest("th"));
    const active = /** @type {HTMLElement} */ (btn).dataset.sort === sort.key;
    th.setAttribute("aria-sort", active ? (sort.dir === "asc" ? "ascending" : "descending") : "none");
  }
}

for (const btn of document.querySelectorAll("button.sort")) {
  btn.addEventListener("click", () => {
    const key = /** @type {import("../index.js").SortKey} */ (/** @type {HTMLElement} */ (btn).dataset.sort);
    sort = { key, dir: sort.key === key && sort.dir === "asc" ? "desc" : "asc" };
    render();
  });
}
render();
document.body.dataset.ready = "true";
