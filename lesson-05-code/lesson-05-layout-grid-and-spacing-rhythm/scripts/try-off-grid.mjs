// Lesson 5: show what the spacing overlay catches that lint cannot.
// Switches off the spacing reset in base.css, so browser default margins and
// padding (h2: 0.83em, p: 1em, fieldset: 0.35em 0.75em) come back. Nobody
// writes those values, so `pnpm lint` stays green; the rendered page does not.
// `--restore` switches the reset back on.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { ROOT } from "./workspace.mjs";

export const FILE = `${ROOT}packages/design-system/src/base.css`;
const ON = ":where(h1, h2, h3, h4, h5, h6, p, ul, ol, dl, dd, figure, blockquote, pre, fieldset, legend) {";
const OFF = ":where(.try-off-grid-reset-disabled) :where(h1, h2, h3, h4, h5, h6, p, ul, ol, dl, dd, figure, blockquote, pre, fieldset, legend) {";

/** @param {string} css */
export const disableReset = (css) => (css.includes(OFF) ? css : css.replace(ON, OFF));
/** @param {string} css */
export const enableReset = (css) => css.replace(OFF, ON);
/** @param {string} css */
export const isResetOn = (css) => css.includes(ON) && !css.includes(OFF);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const css = readFileSync(FILE, "utf-8");
  if (!css.includes(ON) && !css.includes(OFF)) {
    console.error("FAIL: could not find the spacing reset in base.css.");
    process.exit(1);
  }
  if (process.argv.includes("--restore")) {
    writeFileSync(FILE, enableReset(css));
    console.log("Restored: the spacing reset is back on. Reload the Control Tower.");
  } else {
    writeFileSync(FILE, disableReset(css));
    console.log("Spacing reset switched off: browser default margins are back. Reload the Control Tower and turn on the spacing overlay.");
  }
}
