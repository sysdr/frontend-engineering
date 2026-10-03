// WCAG 2.x contrast math. The same file runs in Node (the lint gate) and in
// the browser (the Control Tower panel), so both report identical numbers.

/** @typedef {{ r: number, g: number, b: number }} Rgb */

/** Minimum ratio for each kind of pairing, WCAG 2.2 level AA. */
export const AA = Object.freeze({
  text: 4.5, // normal-size text, SC 1.4.3
  "large-text": 3, // 24px regular or 18.66px bold and up, SC 1.4.3
  ui: 3, // focus rings, control borders, icons, SC 1.4.11
});

/**
 * Parse "#rgb", "#rrggbb", or the "rgb(r, g, b)" form getComputedStyle returns.
 * @param {string} input
 * @returns {Rgb}
 */
export function parseColor(input) {
  const s = input.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(s);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(s);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  throw new Error(`Cannot parse colour "${input}"`);
}

/**
 * A colour in the exact "rgb(r, g, b)" form getComputedStyle reports, so a
 * test can compare what the browser painted with what a token says.
 * @param {string} color
 */
export function toComputedRgb(color) {
  const { r, g, b } = parseColor(color);
  return `rgb(${r}, ${g}, ${b})`;
}

/** @param {number} channel 0-255 */
function linear(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/**
 * Relative luminance: 0 is black, 1 is white.
 * @param {string} color
 */
export function relativeLuminance(color) {
  const { r, g, b } = parseColor(color);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/**
 * Contrast ratio between two colours, from 1 to 21. Order does not matter.
 * @param {string} a
 * @param {string} b
 */
export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * WCAG never rounds up before comparing: 4.499 fails 4.5. Display truncates,
 * so the screen never shows a pass the maths does not support.
 * @param {number} ratio
 */
export function formatRatio(ratio) {
  return `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1`;
}

/**
 * @param {number} ratio
 * @param {keyof typeof AA} kind
 */
export function meetsAA(ratio, kind) {
  return ratio >= AA[kind];
}
