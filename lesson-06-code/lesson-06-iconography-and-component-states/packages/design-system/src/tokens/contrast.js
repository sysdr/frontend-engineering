// Carried forward from Lesson 4: WCAG 2.x contrast maths. The same file runs
// in Node (the lint gate) and in the browser (the Control Tower panel).

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
  const rgb = /^rgba?\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)/.exec(s);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  throw new Error(`Cannot parse colour "${input}"`);
}

/** @param {number} channel 0-255 */
function linear(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance, 0 (black) to 1 (white). @param {string} color */
export function relativeLuminance(color) {
  const { r, g, b } = parseColor(color);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** Contrast ratio between two colours, 1 to 21. Order does not matter. @param {string} a @param {string} b */
export function contrastRatio(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Truncate, never round, so 4.499 can never display as a pass. @param {number} ratio */
export function formatRatio(ratio) {
  return `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1`;
}

/** @param {number} ratio @param {keyof typeof AA} kind */
export const meetsAA = (ratio, kind) => ratio >= AA[kind];
