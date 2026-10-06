// Lesson 6: the Icons panel. Every tile is drawn at 4x on its keyline grid,
// and every check runs on the .svg file itself, fetched as text: the same file
// and the same checkIcon() that `pnpm lint` uses. Pick a tile to read its source.
import { ICON_BUDGET, ICON_GRID, ICON_NAMES, checkIcon, createIcon, updateBadge } from "@pulse/design-system";
import { badge, getText, h, panelHead } from "../lib/dom.js";

const DIR = "/packages/design-system/src/icons/";

/**
 * The file's text with its grid attributes marked: green where the value is
 * the grid's, red where it is not.
 * @param {string} source
 */
function markedSource(source) {
  const pre = h("pre", { class: "icon-source", "data-icon-source": "" });
  const code = h("code", {});
  let last = 0;
  for (const m of source.matchAll(/([\w:-]+)="([^"]*)"/g)) {
    const [all, key, value] = m;
    const index = /** @type {number} */ (m.index);
    const want = key === "rx" ? String(ICON_GRID.cornerRadius) : /** @type {Record<string, string>} */ (ICON_GRID.root)[key];
    if (want === undefined || key === "xmlns") continue;
    code.append(source.slice(last, index), h("mark", value === want ? {} : { "data-off": "" }, all));
    last = index + all.length;
  }
  code.append(source.slice(last));
  pre.append(code);
  return pre;
}

/** @param {HTMLElement} panel */
export async function mountIconSet(panel) {
  const status = badge("neutral", "Reading files", { "data-icon-status": "" });
  const icons = await Promise.all(
    ICON_NAMES.map(async (name) => {
      const source = await getText(`${DIR}${name}.svg`);
      return { name, source, report: checkIcon(source) };
    }),
  );
  const bad = icons.filter((i) => i.report.problems.length);
  updateBadge(status, bad.length ? "danger" : "success", bad.length ? `${bad.length} off the grid` : `${icons.length} of ${icons.length} on the grid`);

  const g = ICON_GRID;
  const facts = h(
    "dl",
    { class: "icon-facts", "data-icon-facts": "" },
    ...[
      ["Canvas", `${g.size} × ${g.size}`],
      ["Stroke", String(g.strokeWidth)],
      ["Caps and joins", "round"],
      ["Corner radius", String(g.cornerRadius)],
      ["Live area", `${g.keylinePadding} to ${g.size - g.keylinePadding}`],
      ["Budget", `${icons.length} of ${ICON_BUDGET}`],
    ].map(([k, v]) => h("div", { class: "fact pulse-stack-1" }, h("dt", { class: "pulse-text-caption pulse-muted" }, k), h("dd", { class: "pulse-text-body fact-value" }, v))),
  );
  const file = h("p", { class: "pulse-text-caption pulse-muted", "data-icon-file": "" });
  const problems = h("ul", { class: "pulse-stack-1", "data-icon-problems": "" });
  const sourceSlot = h("div", {});

  /** @type {Map<string, HTMLButtonElement>} */
  const tiles = new Map();
  /** @param {string} name */
  const select = (name) => {
    const icon = /** @type {(typeof icons)[number]} */ (icons.find((i) => i.name === name));
    for (const [n, t] of tiles) t.setAttribute("aria-pressed", String(n === name));
    file.textContent = `packages/design-system/src/icons/${name}.svg`;
    sourceSlot.replaceChildren(markedSource(icon.source));
    problems.hidden = icon.report.problems.length === 0;
    problems.replaceChildren(...icon.report.problems.map((p) => h("li", {}, badge("danger", p))));
  };
  for (const { name, report } of icons) {
    const ok = report.problems.length === 0;
    const tile = /** @type {HTMLButtonElement} */ (
      h(
        "button",
        { type: "button", class: "icon-tile", "data-icon-tile": name, "aria-pressed": "false", onclick: () => select(name) },
        h("span", { class: "keyline" }, createIcon(name, { size: 96 })),
        h("span", { class: "pulse-text-caption" }, name),
        badge(ok ? "success" : "danger", ok ? "On grid" : "Off grid"),
      )
    );
    tiles.set(name, tile);
  }

  panel.replaceChildren(
    panelHead("icons-title", "Icons", status),
    h("p", { class: "pulse-text-caption pulse-muted" }, "Ten icons drawn by hand on one grid. Each is checked from its own .svg file. Pick one to read its source."),
    h("div", { class: "icon-tiles", role: "group", "aria-label": "Icon set" }, ...tiles.values()),
    h("div", { class: "icon-detail" }, facts, h("div", { class: "pulse-stack-1" }, file, sourceSlot, problems)),
  );
  select((bad[0] ?? icons[0]).name);
}
