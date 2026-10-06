// Writes the generated stylesheets from their token files:
//   typography.js -> typography.css (Lesson 3)
//   colors.js     -> colors.css     (Lesson 4)
//   spacing.js    -> spacing.css    (Lesson 5)
// `--check` fails if any generated file has drifted from its source.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { ROOT } from "./workspace.mjs";

const DIR = `${ROOT}packages/design-system/src/tokens/`;
const OUTPUTS = /** @type {const} */ ([
  ["typography.css", "typography.js", "typographyCss"],
  ["colors.css", "colors.js", "colorsCss"],
  ["spacing.css", "spacing.js", "spacingCss"],
]);

/** Fresh import each time, so a long-running dev server sees edits. */
async function render() {
  /** @type {Record<string, string>} */
  const out = {};
  for (const [css, js, fn] of OUTPUTS) {
    const mod = await import(`${pathToFileURL(DIR + js).href}?t=${Date.now()}`);
    out[css] = mod[fn]();
  }
  return out;
}

export async function generate() {
  const out = await render();
  for (const [file, css] of Object.entries(out)) writeFileSync(DIR + file, css);
  return Object.keys(out);
}

export async function staleFiles() {
  const out = await render();
  return Object.entries(out)
    .filter(([file, css]) => {
      try {
        return readFileSync(DIR + file, "utf-8") !== css;
      } catch {
        return true;
      }
    })
    .map(([file]) => file);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--check")) {
    const stale = await staleFiles();
    if (stale.length) {
      console.error(`FAIL: ${stale.join(", ")} out of date with the token files. Run pnpm tokens.`);
      process.exit(1);
    }
    console.log("OK: typography.css, colors.css and spacing.css match their token files.");
  } else {
    await generate();
    console.log("Wrote typography.css, colors.css and spacing.css.");
  }
}
