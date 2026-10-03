// The invoice list page. Plain DOM, like the Control Tower: one state
// object, one render(). Every element gets its size from a type-scale role
// class (pulse-text-*) or inherits one; nothing here sets a font size.
import { auditTextSizes, formatMoney, typeScale } from "@pulse/design-system";
import { AS_OF, INVOICES } from "./invoice-data.js";
import { buildInvoiceList, inView, sortRows, summarize, viewCounts, VIEWS } from "./invoice-model.js";

const rows = buildInvoiceList(INVOICES, AS_OF);
const state = { view: "all", sort: { key: "id", direction: "descending" }, showRoles: false };

const $ = (selector) => document.querySelector(selector);
const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const asDate = (iso) => dateFmt.format(new Date(`${iso}T12:00:00`));
const STATUS_WORD = { open: "Open", overdue: "Overdue", paid: "Paid", draft: "Draft", void: "Void" };
const TITLE = { all: "All invoices", open: "Open invoices", overdue: "Overdue invoices", paid: "Paid invoices", draft: "Draft invoices", void: "Void invoices" };

function cell(text, className = "") {
  const td = document.createElement("td");
  td.className = className;
  td.textContent = text;
  return td;
}

function renderViews() {
  const counts = viewCounts(rows);
  const group = $("[data-views]");
  group.replaceChildren(
    ...VIEWS.map(({ id, label }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "view pulse-text-body";
      button.dataset.view = id;
      button.setAttribute("aria-pressed", String(state.view === id));
      const count = document.createElement("span");
      count.className = "count";
      count.textContent = String(counts[id]);
      button.append(label, count);
      button.addEventListener("click", () => {
        state.view = id;
        render();
      });
      return button;
    })
  );
}

function renderRows() {
  const shown = sortRows(rows.filter((r) => inView(r, state.view)), state.sort);
  const body = $("[data-rows]");
  if (shown.length === 0) {
    const tr = document.createElement("tr");
    tr.className = "empty";
    const td = cell("No invoices in this view.", "pulse-text-body");
    td.colSpan = 6;
    tr.append(td);
    body.replaceChildren(tr);
  } else {
    body.replaceChildren(
      ...shown.map((r) => {
        const tr = document.createElement("tr");
        tr.dataset.invoice = r.id;
        if (r.status === "void") tr.className = "is-void";
        const badge = document.createElement("span");
        badge.className = `badge b-${r.view} pulse-text-caption`;
        badge.textContent = STATUS_WORD[r.view];
        const status = cell("");
        status.append(badge);
        tr.append(
          cell(r.id, "id"),
          cell(r.customer, "customer"),
          cell(asDate(r.issuedOn), "date"),
          cell(asDate(r.dueOn), "date"),
          cell(formatMoney(r.amountCents), "num"),
          status
        );
        return tr;
      })
    );
  }
  $("[data-list-title]").textContent = TITLE[state.view];
  $("[data-footnote]").textContent = `Showing ${shown.length} of ${rows.length} invoices.`;
  for (const th of document.querySelectorAll("[data-sort-col]")) {
    if (th.dataset.sortCol === state.sort.key) th.setAttribute("aria-sort", state.sort.direction);
    else th.removeAttribute("aria-sort");
  }
}

function renderFigures() {
  const s = summarize(rows);
  $("[data-figure=outstanding]").textContent = formatMoney(s.outstandingCents);
  $("[data-figure=overdue]").textContent = formatMoney(s.overdueCents);
  $("[data-overdue-label]").textContent = `Overdue, ${s.overdueCount} invoices`;
  $("[data-figure=paid]").textContent = formatMoney(s.paidCents);
}

// Measure what the browser actually rendered and tag every text element
// with the role its size matches. Off-scale text gets a dashed red outline.
// The summary's own elements are drawn first, so they get measured too.
function renderAudit() {
  for (const old of document.querySelectorAll("[data-type-role]")) delete old.dataset.typeRole;
  const sentence = $("[data-audit-sentence]");
  sentence.textContent = "Measuring";
  const counts = new Map();
  $("[data-audit-roles]").replaceChildren(
    ...typeScale.map((s) => {
      const li = document.createElement("li");
      li.className = "pulse-text-caption";
      li.dataset.role = s.role;
      const swatch = document.createElement("span");
      swatch.className = "swatch";
      swatch.dataset.swatch = s.role;
      const label = document.createTextNode(`${s.role}, ${+s.sizePx.toFixed(2)}px: `);
      const count = document.createElement("strong");
      count.textContent = "0";
      counts.set(s.role, count);
      li.append(swatch, label, count);
      return li;
    })
  );

  const result = auditTextSizes(document.body);
  for (const entry of result.entries) entry.element.dataset.typeRole = entry.role ?? "off-scale";
  for (const [role, count] of counts) count.textContent = String(result.byRole[role]);
  const off = result.offScale.length;
  sentence.textContent =
    off === 0
      ? `${result.total} text elements measured. All ${result.onScale} sit on a type-scale step.`
      : `${result.total} text elements measured. ${off} use a size that is not on the scale.`;
  document.body.dataset.auditTotal = String(result.total);
  document.body.dataset.auditOffScale = String(off);
}

function render() {
  renderViews();
  renderRows();
  renderFigures();
  $("[data-audit]").hidden = !state.showRoles;
  document.body.classList.toggle("show-roles", state.showRoles);
  const toggle = $("[data-audit-toggle]");
  toggle.setAttribute("aria-pressed", String(state.showRoles));
  toggle.textContent = state.showRoles ? "Hide type roles" : "Show type roles";
  renderAudit();
}

for (const button of document.querySelectorAll("[data-sort]")) {
  button.addEventListener("click", () => {
    const key = button.dataset.sort;
    const same = state.sort.key === key;
    state.sort = { key, direction: same && state.sort.direction === "descending" ? "ascending" : "descending" };
    render();
  });
}
$("[data-audit-toggle]").addEventListener("click", () => {
  state.showRoles = !state.showRoles;
  render();
});
$("[data-as-of]").textContent = `As of ${asDate(AS_OF)}`;
render();
