// The invoice list. Plain DOM: one state object, one render(). Nothing here
// knows which theme is active. Colours come from role variables in CSS.
import { browserThemeController, mountThemeSwitcher } from "@pulse/design-system";
import { formatDate, formatMoney } from "@pulse/utils";
import { STATUS_LABEL, STATUS_TONE, filterInvoices, invoices, sortInvoices, totals } from "../index.js";

const theme = browserThemeController();
mountThemeSwitcher(/** @type {HTMLElement} */ (document.querySelector("[data-theme-slot]")), theme);

const COLUMNS = [
  { key: "id", label: "Invoice" },
  { key: "customer", label: "Customer" },
  { key: "due", label: "Due" },
  { key: "amountCents", label: "Amount", numeric: true },
];
const state = { status: "all", sortKey: "due", sortDir: "asc" };

const $ = (sel) => /** @type {HTMLElement} */ (document.querySelector(sel));

function renderTotals() {
  const t = totals(invoices);
  $("[data-totals]").replaceChildren(
    ...[
      ["Overdue", t.overdue, "danger"],
      ["Open", t.open, "warning"],
      ["Paid", t.paid, "success"],
    ].map(([label, cents, tone]) => {
      const card = document.createElement("div");
      card.className = "total";
      card.innerHTML = `<span class="pulse-badge" data-tone="${tone}">${label}</span><span class="pulse-text-title amount">${formatMoney(cents)}</span>`;
      return card;
    }),
  );
}

function renderHead() {
  $("[data-head]").replaceChildren(
    ...[...COLUMNS, { key: "status", label: "Status" }].map((col) => {
      const th = document.createElement("th");
      th.scope = "col";
      if (col.numeric) th.className = "num";
      if (col.key === "status") {
        th.textContent = col.label;
        return th;
      }
      const active = state.sortKey === col.key;
      if (active) th.setAttribute("aria-sort", state.sortDir === "asc" ? "ascending" : "descending");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sort";
      btn.dataset.active = String(active);
      btn.textContent = col.label;
      btn.addEventListener("click", () => {
        state.sortDir = active && state.sortDir === "asc" ? "desc" : "asc";
        state.sortKey = col.key;
        render();
      });
      th.append(btn);
      return th;
    }),
  );
}

function renderRows() {
  const rows = sortInvoices(filterInvoices(invoices, /** @type {any} */ (state.status)), /** @type {any} */ (state.sortKey), /** @type {any} */ (state.sortDir));
  $("[data-rows]").replaceChildren(
    ...rows.map((inv) => {
      const tr = document.createElement("tr");
      tr.dataset.invoice = inv.id;
      tr.innerHTML =
        `<td class="id">${inv.id}</td><td>${inv.customer}</td>` +
        `<td class="pulse-muted">${formatDate(inv.due)}</td><td class="num">${formatMoney(inv.amountCents)}</td>` +
        `<td><span class="pulse-badge" data-tone="${STATUS_TONE[inv.status]}">${STATUS_LABEL[inv.status]}</span></td>`;
      return tr;
    }),
  );
  $("[data-count]").textContent = `${rows.length} of ${invoices.length}`;
}

function render() {
  renderHead();
  renderRows();
}

$("[data-filter]").addEventListener("change", (e) => {
  state.status = /** @type {HTMLSelectElement} */ (e.target).value;
  render();
});

renderTotals();
render();
document.body.dataset.ready = "true";
