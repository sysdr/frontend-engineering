// Lesson 6: the Button primitive. A real <button>, an optional icon from the
// set, and two variants. Its five states live in components.css.
import { createIcon } from "../icons/icon.js";
import { isForcedState } from "./states.js";

export const BUTTON_VARIANTS = Object.freeze(["primary", "secondary"]);

/**
 * @param {{
 *   label: string,
 *   icon?: string,
 *   variant?: "primary" | "secondary",
 *   disabled?: boolean,
 *   pressed?: boolean,
 *   state?: import("./states.js").ForcedState,
 *   onClick?: (event: MouseEvent) => void,
 *   doc?: Document,
 * }} opts
 * @returns {HTMLButtonElement}
 */
export function createButton({ label, icon, variant = "primary", disabled = false, pressed, state, onClick, doc = document }) {
  if (typeof label !== "string" || !label.trim()) throw new Error("createButton requires a string `label`: it is the button's accessible name.");
  if (!BUTTON_VARIANTS.includes(variant)) throw new Error(`Unknown button variant "${variant}".`);
  if (state !== undefined && !isForcedState(state)) throw new Error(`Unknown state "${state}". Only hover, focus and active can be forced.`);
  const btn = doc.createElement("button");
  btn.type = "button";
  btn.className = "pulse-button";
  btn.dataset.variant = variant;
  if (icon) btn.append(createIcon(icon, { doc }));
  const text = doc.createElement("span");
  text.textContent = label;
  btn.append(text);
  if (pressed !== undefined) btn.setAttribute("aria-pressed", String(pressed));
  if (state) btn.dataset.state = state;
  btn.disabled = disabled;
  if (onClick) btn.addEventListener("click", onClick);
  return btn;
}
