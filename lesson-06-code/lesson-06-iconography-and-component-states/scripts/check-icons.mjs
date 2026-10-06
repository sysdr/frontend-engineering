// Lesson 6: every icon file sits on the grid, every icon is used, and the set
// stays inside its budget. Part of `pnpm lint`.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { ICON_DIR, iconFiles } from "./generate-tokens.mjs";
import { ROOT } from "./workspace.mjs";

const { ICON_BUDGET, ICON_GRID, checkIcon } = await import(pathToFileURL(`${ICON_DIR}convention.js`).href);

/** Source files that could use an icon by name (everything but the icon folder itself). */
function sources(dir = `${ROOT}apps`, out = /** @type {string[]} */ ([])) {
  for (const f of readdirSync(dir)) {
    const p = `${dir}/${f}`;
    if (["node_modules", "dist", "icons"].includes(f)) continue;
    if (statSync(p).isDirectory()) sources(p, out);
    else if (/\.m?js$/.test(f)) out.push(p);
  }
  return out;
}

/** @returns {{ file: string, name: string, problems: string[] }[]} */
export function checkAllIcons() {
  const code = [...sources(), ...sources(`${ROOT}packages/design-system/src`)].map((f) => readFileSync(f, "utf-8")).join("\n");
  return iconFiles().map(({ name, file }) => {
    const { problems } = checkIcon(readFileSync(file, "utf-8"));
    if (!code.includes(`"${name}"`)) problems.push(`no code uses "${name}"; an unused icon is upkeep with no payoff`);
    return { file: file.slice(ROOT.length), name, problems };
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = checkAllIcons();
  const bad = results.filter((r) => r.problems.length);
  for (const r of bad) for (const p of r.problems) console.error(`FAIL: ${r.file}: ${p}`);
  if (results.length > ICON_BUDGET) console.error(`FAIL: ${results.length} icons is past the ${ICON_BUDGET}-icon budget. Weigh a library before drawing more.`);
  if (bad.length || results.length > ICON_BUDGET) process.exit(1);
  const g = ICON_GRID;
  console.log(
    `OK: all ${results.length} icons share one grid (${g.size}x${g.size}, stroke ${g.strokeWidth}, round caps and joins, corner radius ${g.cornerRadius}, points inside ${g.keylinePadding}-${g.size - g.keylinePadding}), all in use, ${results.length} of ${ICON_BUDGET} budget.`,
  );
}
