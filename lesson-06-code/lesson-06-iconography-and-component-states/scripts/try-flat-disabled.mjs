// Lesson 6: make "disabled" technically true but visually invisible. Switches
// off the disabled rule in components.css, so a disabled Button or FormField
// still has the disabled attribute (it can't be clicked or typed in) but looks
// exactly like the default. The State gallery flags it; `--restore` undoes it.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { ROOT } from "./workspace.mjs";

export const FILE = `${ROOT}packages/design-system/src/components/components.css`;
const ON = ".pulse-button:disabled,\n.pulse-field__input:disabled {";
const OFF = ":where(.try-flat-disabled-off) .pulse-button:disabled,\n:where(.try-flat-disabled-off) .pulse-field__input:disabled {";

/** @param {string} css */
export const flatten = (css) => (css.includes(OFF) ? css : css.replace(ON, OFF));
/** @param {string} css */
export const unflatten = (css) => css.replace(OFF, ON);
/** @param {string} css */
export const isDisabledStyled = (css) => css.includes(ON) && !css.includes(OFF);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const css = readFileSync(FILE, "utf-8");
  if (!css.includes(ON) && !css.includes(OFF)) {
    console.error("FAIL: could not find the disabled rule in components.css.");
    process.exit(1);
  }
  if (process.argv.includes("--restore")) {
    writeFileSync(FILE, unflatten(css));
    console.log("Restored: disabled controls look disabled again. Reload the Control Tower.");
  } else {
    writeFileSync(FILE, flatten(css));
    console.log("Disabled styling switched off: disabled controls now look like the default. Reload the Control Tower.");
  }
}
