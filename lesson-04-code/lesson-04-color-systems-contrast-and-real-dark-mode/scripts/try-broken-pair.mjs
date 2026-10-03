// Introduces the classic dark-mode mistake on purpose, so you can watch the
// gate catch it: the dark theme's muted text reuses the LIGHT theme's grey.
// It edits tokens/colors.js and regenerates colors.css, as you would by hand.
//   pnpm try-broken-pair            break it
//   pnpm try-broken-pair --restore  put it back
import { readFileSync, writeFileSync } from "node:fs";
import { generate } from "./generate-tokens.mjs";

const file = new URL("../packages/design-system/src/tokens/colors.js", import.meta.url);
const good = `"text-muted": { light: "slate-600", dark: "slate-400" },`;
const bad = `"text-muted": { light: "slate-600", dark: "slate-600" },`;

const source = readFileSync(file, "utf-8");
const restore = process.argv.includes("--restore");
const [from, to] = restore ? [bad, good] : [good, bad];

if (!source.includes(from)) {
  console.log(restore ? "Already restored: dark text-muted is slate-400." : "Already broken: dark text-muted is slate-600.");
} else {
  writeFileSync(file, source.replace(from, to));
  await generate(); // the same step as `pnpm tokens`, so colors.css matches
  console.log(
    restore
      ? "Restored: dark text-muted is slate-400 again."
      : "Broke it: dark text-muted now uses slate-600, the light theme's grey. Run pnpm lint, or look at the Control Tower.",
  );
}
