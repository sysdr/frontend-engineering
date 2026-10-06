// Carried forward from Lesson 4: make the classic dark-mode mistake on purpose
// (dark muted text reusing the light theme's grey). `--restore` undoes it.
import { readFileSync, writeFileSync } from "node:fs";
import { ROOT } from "./workspace.mjs";
import { generate } from "./generate-tokens.mjs";

const FILE = `${ROOT}packages/design-system/src/tokens/colors.js`;
const GOOD = `"text-muted": { light: "slate-600", dark: "slate-400" },`;
const BAD = `"text-muted": { light: "slate-600", dark: "slate-600" },`;

const restore = process.argv.includes("--restore");
const src = readFileSync(FILE, "utf-8");
const [from, to] = restore ? [BAD, GOOD] : [GOOD, BAD];
if (!src.includes(from)) {
  console.log(restore ? "Nothing to restore: text-muted is already correct." : "Already broken. Run with --restore to undo.");
} else {
  writeFileSync(FILE, src.replace(from, to));
  await generate();
  console.log(restore ? "Restored dark text-muted to slate-400." : "Broke it: dark text-muted now reuses slate-600. Watch the Contrast audit panel.");
}
