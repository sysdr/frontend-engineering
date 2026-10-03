// Writes the generated stylesheets from the token modules.
//   pnpm tokens          regenerate typography.css and colors.css
//   pnpm tokens --check  fail if either committed file is stale (part of pnpm lint)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const dir = fileURLToPath(new URL("../packages/design-system/src/tokens/", import.meta.url));

export async function generate({ check = false } = {}) {
  // Cache-busting query: the dev server calls this again after colors.js changes.
  const bust = `?t=${Date.now()}`;
  const { typographyCss } = await import(pathToFileURL(`${dir}typography.js`).href + bust);
  const { colorsCss } = await import(pathToFileURL(`${dir}colors.js`).href + bust);
  const outputs = [
    ["typography.css", typographyCss(), "typography.js"],
    ["colors.css", colorsCss(), "colors.js"],
  ];
  const stale = [];
  for (const [file, css, source] of outputs) {
    let current = "";
    try {
      current = readFileSync(dir + file, "utf-8");
    } catch {}
    if (current === css) continue;
    if (check) stale.push(`${file} is out of date with tokens/${source}. Run: pnpm tokens`);
    else writeFileSync(dir + file, css);
  }
  return stale;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const check = process.argv.includes("--check");
  const stale = await generate({ check });
  if (stale.length) {
    stale.forEach((s) => console.error(`FAIL: ${s}`));
    process.exit(1);
  }
  console.log(check ? "OK: typography.css and colors.css match their token files." : "Wrote typography.css and colors.css.");
}
