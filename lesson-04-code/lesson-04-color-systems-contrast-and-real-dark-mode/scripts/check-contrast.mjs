// The contrast gate (last step of pnpm lint). Every declared pair, both
// themes, real WCAG maths. Exit 1 names each failing pair and its ratio.
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const src = fileURLToPath(new URL("../packages/design-system/src/", import.meta.url));

/** Fresh import each call, so the dev server sees edits to colors.js. */
export async function runContrastGate() {
  const bust = `?t=${Date.now()}`;
  const colors = await import(pathToFileURL(`${src}tokens/colors.js`).href + bust);
  const { auditContrast, summarize } = await import(pathToFileURL(`${src}contrast-audit.js`).href);
  const { formatRatio } = await import(pathToFileURL(`${src}tokens/contrast.js`).href);
  const rows = auditContrast({ resolve: colors.resolveRole, pairList: colors.pairs });
  const summary = summarize(rows);
  return {
    ...summary,
    lines: summary.failing.map(
      (r) => `${r.theme}: ${r.fg} on ${r.bg} is ${formatRatio(r.ratio)}, needs ${r.required}:1 (${r.use})`,
    ),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runContrastGate();
  if (result.failing.length) {
    result.lines.forEach((l) => console.error(`FAIL: ${l}`));
    console.error(`${result.failing.length} of ${result.total} contrast checks fail WCAG AA.`);
    process.exit(1);
  }
  console.log(`OK: all ${result.total} contrast checks pass WCAG AA (${result.total / 2} pairs x light and dark).`);
}
