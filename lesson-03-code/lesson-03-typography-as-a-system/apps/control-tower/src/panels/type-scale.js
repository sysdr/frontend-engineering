// Panel 3 (Lesson 3) — the type scale. Each role is rendered for real with
// its .pulse-text-<role> class, then MEASURED with getComputedStyle, so the
// numbers you read are what the browser drew, not what the token file
// claims. The staircase is drawn from those measurements. The lint card is
// the same pulse/no-raw-font-size result `pnpm lint` prints.
import { buildScale, BASE_PX, MIN_LEGIBLE_PX, TYPE_RATIO, typeScale } from "@pulse/design-system";
import { el } from "../lib/dom.js";

export const COMPARE_RATIOS = [
  { ratio: 1.125, name: "Major second" },
  { ratio: 1.2, name: "Minor third" },
  { ratio: TYPE_RATIO, name: "Major third" },
  { ratio: 1.333, name: "Perfect fourth" },
  { ratio: 1.5, name: "Perfect fifth" },
];

const SPECIMEN = {
  caption: "Cached here",
  body: "billing-team approves this change",
  subheading: "Build board",
  heading: "Ownership",
  title: "8 of 8 cached",
  headline: "Invoices",
  display: "$48,210",
};

export const px = (n) => `${+n.toFixed(2)}px`;

// What the browser actually applied to one specimen element.
export function measure(node) {
  const style = getComputedStyle(node);
  return {
    sizePx: Number.parseFloat(style.fontSize),
    lineHeightPx: Number.parseFloat(style.lineHeight),
    weight: Number(style.fontWeight),
  };
}

export const matches = (token, rendered) =>
  Math.abs(token.sizePx - rendered.sizePx) <= 0.05 &&
  Math.abs(token.lineHeightPx - rendered.lineHeightPx) <= 0.05 &&
  token.weight === rendered.weight;

function renderSpecimens(table) {
  const head = el("thead");
  const hr = el("tr");
  for (const label of ["Role", "Specimen", "Token", "Rendered", "Line height", "Weight", ""]) {
    hr.append(el("th", { scope: "col" }, label));
  }
  head.append(hr);
  const body = el("tbody");
  const rows = [];
  for (const token of [...typeScale].reverse()) {
    const sample = el("span", { class: `sample pulse-text-${token.role}`, "data-specimen": token.role }, SPECIMEN[token.role]);
    const tr = el("tr", { "data-role": token.role });
    const role = el("th", { scope: "row" });
    role.append(el("span", { class: "role-name" }, token.role), el("span", { class: "role-step" }, `step ${token.step}`));
    const sampleCell = el("td", { class: "sample-cell" });
    sampleCell.append(sample);
    tr.append(role, sampleCell);
    body.append(tr);
    rows.push({ token, tr, sample });
  }
  table.replaceChildren(head, body);

  // Measure only after the rows are in the document.
  return rows.map(({ token, tr, sample }) => {
    const rendered = measure(sample);
    const ok = matches(token, rendered);
    tr.dataset.match = String(ok);
    tr.append(
      el("td", { class: "num", "data-token-px": token.sizePx }, px(token.sizePx)),
      el("td", { class: "num", "data-rendered-px": rendered.sizePx }, px(rendered.sizePx)),
      el("td", { class: "num", "data-rendered-lh": rendered.lineHeightPx }, `${px(rendered.lineHeightPx)} (${(rendered.lineHeightPx / rendered.sizePx).toFixed(2)}×)`),
      el("td", { class: "num" }, String(rendered.weight)),
      el("td", { class: ok ? "ok" : "warn" }, ok ? "Matches" : "Drifted")
    );
    return { ...token, rendered, ok };
  });
}

const STAIR = { col: 52, bar: 30, ghost: 12, top: 18, height: 168, foot: 26 };

function renderStairs(svg, measured, compareRatio) {
  const ghosts = compareRatio === TYPE_RATIO ? null : buildScale({ ratio: compareRatio });
  const tallest = Math.max(...measured.map((m) => m.rendered.sizePx), ...(ghosts ?? []).map((g) => g.sizePx));
  const k = STAIR.height / tallest;
  const width = measured.length * STAIR.col + 8;
  const base = STAIR.top + STAIR.height;
  svg.replaceChildren();
  svg.setAttribute("viewBox", `0 0 ${width} ${base + STAIR.foot}`);
  svg.setAttribute("width", String(width));
  svg.append(el("svg:line", { class: "stair-floor", x1: 0, x2: width, y1: base, y2: base }));
  const floorY = base - MIN_LEGIBLE_PX * k;
  svg.append(el("svg:line", { class: "stair-min", x1: 0, x2: width, y1: floorY, y2: floorY }));
  measured.forEach((m, i) => {
    const x = 4 + i * STAIR.col;
    const h = m.rendered.sizePx * k;
    const bar = el("svg:rect", { class: `stair${m.ok ? "" : " drifted"}`, x, y: base - h, width: STAIR.bar, height: h, rx: 4, "data-stair": m.role });
    bar.append(el("svg:title", {}, `${m.role}: ${px(m.rendered.sizePx)} rendered`));
    svg.append(bar);
    if (ghosts) {
      const g = ghosts[i];
      const gh = g.sizePx * k;
      svg.append(el("svg:rect", { class: `ghost${g.sizePx < MIN_LEGIBLE_PX ? " too-small" : ""}`, x: x + STAIR.bar + 3, y: base - gh, width: STAIR.ghost, height: gh, rx: 3, "data-ghost": g.role }));
    }
    svg.append(el("svg:text", { class: "stair-label", x: x + STAIR.bar / 2, y: base + 18, "text-anchor": "middle" }, String(+m.rendered.sizePx.toFixed(1))));
  });
}

function compareSentence(compareRatio) {
  const shipped = `Shipped: ratio ${TYPE_RATIO} from ${BASE_PX}px, ${typeScale.length} roles from step ${typeScale[0].step} to ${typeScale.at(-1).step}.`;
  if (compareRatio === TYPE_RATIO) return `${shipped} Pick another ratio to see its stairs beside these.`;
  const other = buildScale({ ratio: compareRatio });
  const low = other[0];
  const high = other.at(-1);
  const floor = low.sizePx < MIN_LEGIBLE_PX ? `, under the ${MIN_LEGIBLE_PX}px floor` : "";
  return `${shipped} At ${compareRatio}, caption would be ${px(low.sizePx)}${floor}, and display ${px(high.sizePx)}.`;
}

function renderLint(box, typeLint) {
  box.replaceChildren();
  if (!typeLint) return;
  const { violations, filesChecked } = typeLint;
  if (violations.length === 0) {
    box.dataset.state = "clean";
    box.append(el("p", { class: "ok" }, `No hand-typed font sizes in ${filesChecked} JS and CSS files.`), el("p", { class: "muted" }, "Same result as pulse/no-raw-font-size in pnpm lint."));
    return;
  }
  box.dataset.state = "failing";
  box.append(el("p", { class: "warn" }, `${violations.length} hand-typed font size${violations.length === 1 ? "" : "s"}. pnpm lint will fail.`));
  for (const v of violations) {
    const note = el("p", { class: "violation" });
    note.append(el("strong", {}, `${v.file}:${v.line}`), v.message);
    box.append(note);
  }
}

export function renderTypeScale(root, { data, compareRatio, onPickRatio }) {
  const select = root.querySelector("[data-compare]");
  if (select.options.length === 0) {
    for (const { ratio, name } of COMPARE_RATIOS) {
      select.append(el("option", { value: ratio }, `${ratio} ${name}${ratio === TYPE_RATIO ? ", shipped" : ""}`));
    }
    select.addEventListener("change", () => onPickRatio(Number(select.value)));
  }
  select.value = String(compareRatio);

  const measured = renderSpecimens(root.querySelector("[data-specimens]"));
  // the table reads largest-first; the stairs climb smallest-first, left to right
  renderStairs(root.querySelector("[data-stairs]"), [...measured].reverse(), compareRatio);
  root.querySelector("[data-type-sentence]").textContent = compareSentence(compareRatio);
  root.dataset.allMatch = String(measured.every((m) => m.ok));
  renderLint(root.querySelector("[data-type-lint]"), data.typeLint);
}
