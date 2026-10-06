// Carried forward from Lesson 4: audit every declared pair in both themes.
// `resolve` lets Node feed token values and the browser feed measured colours.
import { THEMES, pairs, resolveRole } from "./tokens/colors.js";
import { AA, contrastRatio, meetsAA } from "./tokens/contrast.js";

/** @typedef {import("./tokens/colors.js").Pair & { theme: import("./tokens/colors.js").ThemeName, fgColor: string, bgColor: string, ratio: number, required: number, pass: boolean }} AuditRow */

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
