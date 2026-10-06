// Carried forward from Lesson 4: the contrast gate, last step of `pnpm lint`.
import { pathToFileURL } from "node:url";
import { ROOT } from "./workspace.mjs";

const SRC = `${ROOT}packages/design-system/src/`;

/** Audit every declared pair in both themes, reading the token file fresh. */
export async function runContrastGate() {
  const colors = await import(`${pathToFileURL(`${SRC}tokens/colors.js`).href}?t=${Date.now()}`);
  const { auditContrast, summarize } = await import(pathToFileURL(`${SRC}contrast-audit.js`).href);
  const rows = auditContrast({ resolve: colors.resolveRole, pairList: colors.pairs });
  const s = summarize(rows);
  return {
    total: s.total,
    passing: s.passing,
    pairs: colors.pairs.length,
    failing: s.failing.map((/** @type {any} */ r) => ({ theme: r.theme, fg: r.fg, bg: r.bg, use: r.use, ratio: Math.floor(r.ratio * 100) / 100, required: r.required })),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = await runContrastGate();
  if (r.failing.length) {
    for (const f of r.failing) console.error(`FAIL: ${f.theme} ${f.fg} on ${f.bg} (${f.use}) is ${f.ratio.toFixed(2)}:1, needs ${f.required}:1`);
    process.exit(1);
  }
  console.log(`OK: all ${r.total} contrast checks pass WCAG AA (${r.pairs} pairs x light and dark).`);
}
