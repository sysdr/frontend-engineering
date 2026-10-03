// The contrast audit: every declared pair, in every theme, through the WCAG
// maths. Node calls it with the token values (the lint gate). The Control
// Tower calls it with colours measured from the rendered page.

import { AA, contrastRatio, meetsAA } from "./tokens/contrast.js";
import { THEMES, pairs, resolveRole } from "./tokens/colors.js";

/**
 * @typedef {object} AuditRow
 * @property {import("./tokens/colors.js").ThemeName} theme
 * @property {string} fg
 * @property {string} bg
 * @property {"text" | "large-text" | "ui"} kind
 * @property {string} use
 * @property {string} fgColor
 * @property {string} bgColor
 * @property {number} ratio
 * @property {number} required
 * @property {boolean} pass
 */

/**
 * @param {{ resolve?: (role: string, theme: import("./tokens/colors.js").ThemeName) => string, pairList?: readonly import("./tokens/colors.js").Pair[] }} [opts]
 * @returns {AuditRow[]}
 */
export function auditContrast({ resolve = resolveRole, pairList = pairs } = {}) {
  /** @type {AuditRow[]} */
  const rows = [];
  for (const theme of THEMES) {
    for (const p of pairList) {
      const fgColor = resolve(p.fg, theme);
      const bgColor = resolve(p.bg, theme);
      const ratio = contrastRatio(fgColor, bgColor);
      rows.push({ theme, ...p, fgColor, bgColor, ratio, required: AA[p.kind], pass: meetsAA(ratio, p.kind) });
    }
  }
  return rows;
}

/** @param {AuditRow[]} rows */
export function summarize(rows) {
  const failing = rows.filter((r) => !r.pass);
  return { total: rows.length, passing: rows.length - failing.length, failing };
}
