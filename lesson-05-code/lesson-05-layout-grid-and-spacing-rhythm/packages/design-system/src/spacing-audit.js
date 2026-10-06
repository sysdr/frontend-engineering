// Lesson 5: measure the spacing a page actually renders.
//
// Lint can only check values someone typed. This reads the rendered page:
// every padding and margin from computed style, and every gap between
// neighbouring items of a flex or grid container from their real boxes.
// Each measurement is then classified against the 8px grid.
import { classifyLength } from "./tokens/spacing.js";

/** @typedef {{ left: number, top: number, right: number, bottom: number }} Box */
/** @typedef {"padding" | "margin" | "gap"} Kind */
/** @typedef {"step" | "multiple" | "off-grid" | "free"} Status */
/** @typedef {{ kind: Kind, side: string, px: number, status: Status, box: Box, where: string }} Measurement */

const EPS = 0.05;
const SIDES = /** @type {const} */ (["top", "right", "bottom", "left"]);
const SKIP = new Set(["SCRIPT", "STYLE", "LINK", "META", "TITLE", "HEAD", "TEMPLATE", "BR", "WBR", "NOSCRIPT"]);
// Distributed alignment hands out leftover space. Those gaps depend on the
// window size, not on a value anyone chose, so they are "free", not counted.
const DISTRIBUTED = /^(?:space-between|space-around|space-evenly)$/;

/** @param {Box} b @returns {Box} */
const norm = (b) => ({
  left: Math.min(b.left, b.right),
  right: Math.max(b.left, b.right),
  top: Math.min(b.top, b.bottom),
  bottom: Math.max(b.top, b.bottom),
});

/** @param {Box[]} boxes @returns {Box} */
const union = (boxes) => ({
  left: Math.min(...boxes.map((b) => b.left)),
  right: Math.max(...boxes.map((b) => b.right)),
  top: Math.min(...boxes.map((b) => b.top)),
  bottom: Math.max(...boxes.map((b) => b.bottom)),
});

/**
 * Gaps between neighbouring items, measured from their boxes. Items are first
 * grouped into lines: in a column every item is its own line; in a row or a
 * grid, items whose boxes overlap vertically share a line. Gaps are measured
 * between neighbours inside a line (axis x) and between consecutive lines
 * (axis y), where a line's box is the union of its items.
 * @param {Box[]} boxes
 * @param {"row" | "column"} direction
 * @returns {{ axis: "x" | "y", px: number, box: Box }[]}
 */
export function neighbourGaps(boxes, direction) {
  const sorted = [...boxes].sort((a, b) => a.top - b.top || a.left - b.left);
  /** @type {Box[][]} */
  const lines = [];
  for (const b of sorted) {
    const line = lines.at(-1);
    if (direction === "row" && line && b.top < Math.max(...line.map((x) => x.bottom)) - EPS) line.push(b);
    else lines.push([b]);
  }
  /** @type {{ axis: "x" | "y", px: number, box: Box }[]} */
  const gaps = [];
  for (const line of lines) {
    const row = [...line].sort((a, b) => a.left - b.left);
    for (let i = 1; i < row.length; i++) {
      const [a, b] = [row[i - 1], row[i]];
      const px = b.left - a.right;
      if (px > EPS) gaps.push({ axis: "x", px, box: norm({ left: a.right, right: b.left, top: Math.max(a.top, b.top), bottom: Math.min(a.bottom, b.bottom) }) });
    }
  }
  const lineBoxes = lines.map(union);
  for (let i = 1; i < lineBoxes.length; i++) {
    const [a, b] = [lineBoxes[i - 1], lineBoxes[i]];
    const px = b.top - a.bottom;
    if (px > EPS) gaps.push({ axis: "y", px, box: { left: Math.min(a.left, b.left), right: Math.max(a.right, b.right), top: a.bottom, bottom: b.top } });
  }
  return gaps;
}

/** @param {string} value */
const toPx = (value) => Number.parseFloat(value) || 0;

/** @param {DOMRect} r @param {number} sx @param {number} sy @returns {Box} */
const toBox = (r, sx, sy) => ({ left: r.left + sx, top: r.top + sy, right: r.right + sx, bottom: r.bottom + sy });

/** Where a measurement sits, for humans: "h2.panel-title in spacing". @param {Element} el */
export function describe(el) {
  const cls = (el.getAttribute("class") ?? "").split(/\s+/).find((c) => c && !/^pulse-(?:span|stack|cluster)-/.test(c));
  const panel = el.closest("[data-panel]")?.getAttribute("data-panel");
  return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ""}${panel ? ` in ${panel}` : ""}`;
}

/**
 * The strip a padding or margin occupies, in document coordinates.
 * @param {Box} box border box @param {Box} border widths @param {"padding" | "margin"} kind
 * @param {"top" | "right" | "bottom" | "left"} side @param {number} px
 * @returns {Box}
 */
function strip(box, border, kind, side, px) {
  const size = Math.abs(px);
  const inner = { left: box.left + border.left, right: box.right - border.right, top: box.top + border.top, bottom: box.bottom - border.bottom };
  if (kind === "padding") {
    if (side === "top") return { ...inner, bottom: inner.top + size };
    if (side === "bottom") return { ...inner, top: inner.bottom - size };
    if (side === "left") return { ...inner, right: inner.left + size };
    return { ...inner, left: inner.right - size };
  }
  if (side === "top") return { ...box, top: box.top - size, bottom: box.top };
  if (side === "bottom") return { ...box, top: box.bottom, bottom: box.bottom + size };
  if (side === "left") return { ...box, left: box.left - size, right: box.left };
  return { ...box, left: box.right, right: box.right + size };
}

/**
 * Boxes of a container's in-flow items, including runs of bare text (which a
 * flex or grid container wraps in an anonymous item).
 * @param {Element} el @param {Window & typeof globalThis} win
 * @returns {DOMRect[]}
 */
function itemRects(el, win) {
  /** @type {DOMRect[]} */
  const rects = [];
  for (const node of el.childNodes) {
    let r = null;
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.textContent?.trim()) continue;
      const range = el.ownerDocument.createRange();
      range.selectNodeContents(node);
      r = range.getBoundingClientRect();
    } else if (node instanceof win.Element) {
      const cs = win.getComputedStyle(node);
      if (cs.display === "none" || cs.display === "contents" || cs.position === "absolute" || cs.position === "fixed") continue;
      r = node.getBoundingClientRect();
    }
    if (r && (r.width > 0 || r.height > 0)) rects.push(r);
  }
  return rects;
}

/**
 * Measure every padding, margin and flex/grid gap under `root`.
 * SVG content is skipped: inside an <svg>, positions are drawing coordinates,
 * not CSS spacing.
 * @param {Element} root
 * @param {{ ignore?: (el: Element) => boolean }} [opts]
 * @returns {Measurement[]}
 */
export function measureSpacing(root, { ignore = () => false } = {}) {
  const win = root.ownerDocument.defaultView;
  if (!win) return [];
  const [sx, sy] = [win.scrollX, win.scrollY];
  /** @type {Measurement[]} */
  const out = [];
  for (const el of [root, ...root.querySelectorAll("*")]) {
    if (SKIP.has(el.tagName) || el instanceof win.SVGElement || ignore(el)) continue;
    const cs = win.getComputedStyle(el);
    if (cs.display === "none" || cs.display === "contents") continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    const box = toBox(rect, sx, sy);
    const where = describe(el);
    const border = { top: toPx(cs.borderTopWidth), right: toPx(cs.borderRightWidth), bottom: toPx(cs.borderBottomWidth), left: toPx(cs.borderLeftWidth) };

    for (const side of SIDES) {
      for (const kind of /** @type {const} */ (["padding", "margin"])) {
        const px = toPx(cs.getPropertyValue(`${kind}-${side}`));
        if (Math.abs(px) > EPS) out.push({ kind, side, px, status: classifyLength(px), box: strip(box, border, kind, side, px), where });
      }
    }

    const flex = cs.display.includes("flex");
    if (!flex && !cs.display.includes("grid")) continue;
    const items = itemRects(el, win).map((r) => toBox(r, sx, sy));
    if (items.length < 2) continue;
    const column = flex && cs.flexDirection.startsWith("column");
    const mainAxis = column ? "y" : "x";
    for (const g of neighbourGaps(items, column ? "column" : "row")) {
      const free = DISTRIBUTED.test(g.axis === mainAxis ? cs.justifyContent : cs.alignContent);
      out.push({ kind: "gap", side: g.axis === "x" ? "column" : "row", px: g.px, status: free ? "free" : classifyLength(g.px), box: g.box, where });
    }
  }
  return out;
}

/** @param {Measurement[]} measurements */
export function summarizeSpacing(measurements) {
  const counted = measurements.filter((m) => m.status !== "free");
  const offGrid = counted.filter((m) => m.status === "off-grid");
  /** @type {Record<Kind, number>} */
  const byKind = { padding: 0, margin: 0, gap: 0 };
  for (const m of counted) byKind[m.kind]++;
  return { total: counted.length, onGrid: counted.length - offGrid.length, offGrid, free: measurements.length - counted.length, byKind };
}

/**
 * A grid container's column tracks and gutter, measured as rendered.
 * @param {Element} el
 * @returns {{ gap: number, tracks: Box[] }}
 */
export function gridTracks(el) {
  const win = el.ownerDocument.defaultView;
  if (!win) return { gap: 0, tracks: [] };
  const cs = win.getComputedStyle(el);
  const widths = cs.gridTemplateColumns.split(/\s+/).map(Number.parseFloat).filter(Number.isFinite);
  const gap = toPx(cs.columnGap);
  const r = el.getBoundingClientRect();
  const top = r.top + win.scrollY + toPx(cs.borderTopWidth) + toPx(cs.paddingTop);
  const bottom = r.bottom + win.scrollY - toPx(cs.borderBottomWidth) - toPx(cs.paddingBottom);
  let x = r.left + win.scrollX + toPx(cs.borderLeftWidth) + toPx(cs.paddingLeft);
  const tracks = widths.map((w) => {
    const track = { left: x, right: x + w, top, bottom };
    x += w + gap;
    return track;
  });
  return { gap, tracks };
}
