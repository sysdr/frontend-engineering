// Lesson 6: draw one icon off the grid on purpose. refresh.svg gets a 1.5
// stroke, the classic "it came from a different pack" mistake. The lint check
// fails, the Icons panel turns its tile red, and every refresh icon in the
// Control Tower renders visibly thinner. `--restore` puts the file back.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { ICON_DIR, generate } from "./generate-tokens.mjs";

export const FILE = `${ICON_DIR}refresh.svg`;
const GOOD = 'stroke="currentColor" stroke-width="2"';
const ODD = 'stroke="currentColor" stroke-width="1.5"';

/** @param {string} svg */
export const makeOdd = (svg) => svg.replace(GOOD, ODD);
/** @param {string} svg */
export const makeEven = (svg) => svg.replace(ODD, GOOD);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const svg = readFileSync(FILE, "utf-8");
  const restore = process.argv.includes("--restore");
  writeFileSync(FILE, restore ? makeEven(svg) : makeOdd(svg));
  await generate();
  console.log(
    restore
      ? "Restored: refresh.svg is back on the 2-unit stroke. Reload the Control Tower."
      : "refresh.svg now has a 1.5 stroke. Run pnpm lint, and reload the Control Tower to see its tile turn red.",
  );
}
