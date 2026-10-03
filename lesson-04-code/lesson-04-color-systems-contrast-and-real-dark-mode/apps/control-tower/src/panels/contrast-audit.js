// The contrast-audit panel. Every declared pair is drawn for real, once in a
// light-themed box and once in a dark-themed box, whatever theme the page is
// in. The ratios come from the colours the browser actually rendered, run
// through the same contrast.js the lint gate uses.
import { AA, contrastRatio, formatRatio, meetsAA, pairs } from "@pulse/design-system";
import { h } from "../lib/dom.js";
import { getJson, onLive } from "../lib/live.js";

const THEMES = ["light", "dark"];

/** @param {{ fg: string, bg: string, kind: string }} pair @param {string} theme */
function sample(pair, theme) {
  const swatch = h("span", {
    class: `contrast-sample contrast-sample--${pair.kind}`,
    "data-theme": theme,
    style: `--fg: var(--pulse-color-${pair.fg}); --bg: var(--pulse-color-${pair.bg});`,
    "aria-hidden": "true",
  });
  swatch.textContent = pair.kind === "ui" ? "" : "Aa";
  return swatch;
}

/** Colours as rendered. UI pairs draw fg as a border, text pairs as text. @param {HTMLElement} el @param {string} kind */
function measure(el, kind) {
  const cs = getComputedStyle(el);
  return { fg: kind === "ui" ? cs.borderTopColor : cs.color, bg: cs.backgroundColor };
}

/** @param {HTMLElement} root */
export async function mountContrastAudit(root) {
  const gate = h("p", { class: "gate", "data-contrast-gate": "", "aria-live": "polite" });
  const count = h("span", { class: "pulse-muted pulse-text-caption", "data-contrast-count": "" });
  const drift = h("p", { class: "gate gate--warn", "data-contrast-drift": "", hidden: true });
  const tbody = h("tbody");

  const rows = pairs.map((pair) => {
    const cells = THEMES.map((theme) => {
      const el = sample(pair, theme);
      const ratio = h("span", { class: "ratio", "data-ratio": "" });
      const verdict = h("span", { class: "pulse-badge", "data-verdict": "" });
      const td = h("td", { "data-theme-cell": theme }, h("span", { class: "cell" }, el, ratio, verdict));
      return { theme, el, ratio, verdict, td };
    });
    const tr = h(
      "tr",
      { "data-pair": `${pair.fg}/${pair.bg}` },
      h("th", { scope: "row" }, h("span", { class: "pair-name" }, `${pair.fg} on ${pair.bg}`), h("span", { class: "pulse-muted pulse-text-caption" }, pair.use)),
      ...cells.map((c) => c.td),
      h("td", { class: "pulse-muted num" }, `${AA[pair.kind]}:1 ${pair.kind === "ui" ? "(UI)" : ""}`),
    );
    tbody.append(tr);
    return { pair, tr, cells };
  });

  root.replaceChildren(
    h("div", { class: "panel-head" }, h("h2", { id: "contrast-title", class: "pulse-text-heading" }, "Contrast audit"), count),
    h("p", { class: "pulse-muted pulse-text-caption" }, "Every colour pair the UI draws, rendered in both themes and measured against WCAG AA."),
    gate,
    drift,
    h(
      "div",
      { class: "table-scroll" },
      h(
        "table",
        { class: "audit" },
        h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Pair"), h("th", { scope: "col" }, "Light"), h("th", { scope: "col" }, "Dark"), h("th", { scope: "col", class: "num" }, "Needs"))),
        tbody,
      ),
    ),
  );

  /** @returns {Set<string>} the failing "theme:fg/bg" keys, as measured */
  function remeasure() {
    const failing = new Set();
    for (const { pair, tr, cells } of rows) {
      let rowPass = true;
      for (const c of cells) {
        const { fg, bg } = measure(c.el, pair.kind);
        const r = contrastRatio(fg, bg);
        const pass = meetsAA(r, /** @type {keyof typeof AA} */ (pair.kind));
        c.ratio.textContent = formatRatio(r);
        c.verdict.textContent = pass ? "Pass" : "Fail";
        c.verdict.dataset.tone = pass ? "success" : "danger";
        c.td.dataset.state = pass ? "pass" : "fail";
        if (!pass) {
          rowPass = false;
          failing.add(`${c.theme}:${pair.fg}/${pair.bg}`);
        }
      }
      tr.dataset.state = rowPass ? "pass" : "fail";
    }
    const total = rows.length * THEMES.length;
    count.textContent = `${total - failing.size} of ${total} pass`;
    root.dataset.failing = String(failing.size);
    return failing;
  }

  /** @param {{ total: number, failing: { theme: string, fg: string, bg: string }[], lines: string[] }} result @param {Set<string>} measured */
  function showGate(result, measured) {
    const ok = result.failing.length === 0;
    gate.dataset.state = ok ? "pass" : "fail";
    gate.replaceChildren(
      h("span", { class: "pulse-badge", "data-tone": ok ? "success" : "danger" }, ok ? "Gate passing" : "Gate failing"),
      " ",
      ok ? `pnpm lint: all ${result.total} contrast checks pass.` : `pnpm lint fails on ${result.failing.length} of ${result.total} checks.`,
      ...(ok ? [] : [h("ul", { class: "gate-lines" }, ...result.lines.map((l) => h("li", {}, l)))]),
    );
    // The panel measures the CSS; the gate reads the tokens. If they ever
    // disagree, colors.css is stale and the panel says so.
    const fromTokens = new Set(result.failing.map((f) => `${f.theme}:${f.fg}/${f.bg}`));
    const agree = fromTokens.size === measured.size && [...fromTokens].every((k) => measured.has(k));
    drift.hidden = agree;
    drift.textContent = agree ? "" : "Rendered colours disagree with tokens/colors.js. Run pnpm tokens to regenerate colors.css.";
  }

  showGate(await getJson("/api/contrast"), remeasure());

  // colors.js changed: the server has regenerated colors.css and re-run the
  // gate. Swap in the fresh stylesheet, then measure again.
  onLive("tokens", async (result) => {
    await reloadColors();
    showGate(result, remeasure());
  });
}

/** Replace the colours stylesheet with a fresh copy and wait for it to apply. */
async function reloadColors() {
  const old = /** @type {HTMLLinkElement} */ (document.querySelector("link[data-colors-sheet]"));
  const next = /** @type {HTMLLinkElement} */ (old.cloneNode());
  next.href = `${old.href.split("?")[0]}?v=${Date.now()}`;
  await new Promise((resolve) => {
    next.addEventListener("load", resolve, { once: true });
    next.addEventListener("error", resolve, { once: true });
    old.after(next);
  });
  old.remove();
}
