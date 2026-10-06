// Lesson 6: the FormField primitive. A label wired to its input by id, an
// optional hint and error wired by aria-describedby, and the same five states
// as Button, from components.css.
import { createIcon } from "../icons/icon.js";
import { isForcedState } from "./states.js";

let nextId = 0;

/**
 * @param {{
 *   label: string,
 *   type?: string,
 *   name?: string,
 *   value?: string,
 *   placeholder?: string,
 *   hint?: string,
 *   errorMessage?: string,
 *   required?: boolean,
 *   disabled?: boolean,
 *   state?: import("./states.js").ForcedState,
 *   doc?: Document,
 * }} opts
 * @returns {HTMLDivElement}
 */
export function createFormField({ label, type = "text", name, value, placeholder, hint, errorMessage, required = false, disabled = false, state, doc = document }) {
  if (typeof label !== "string" || !label.trim()) throw new Error("createFormField requires a string `label`: it is the input's accessible name.");
  if (state !== undefined && !isForcedState(state)) throw new Error(`Unknown state "${state}". Only hover, focus and active can be forced.`);
  const id = `pulse-field-${++nextId}`;
  const wrap = doc.createElement("div");
  wrap.className = "pulse-field";

  const lab = doc.createElement("label");
  lab.className = "pulse-field__label";
  lab.htmlFor = id;
  lab.textContent = label;

  const input = doc.createElement("input");
  input.className = "pulse-field__input";
  input.id = id;
  input.type = type;
  if (name) input.name = name;
  if (value !== undefined) input.value = value;
  if (placeholder) input.placeholder = placeholder;
  input.required = required;
  input.disabled = disabled;
  if (state) input.dataset.state = state;
  wrap.append(lab, input);

  /** @type {string[]} */
  const describedBy = [];
  if (hint) {
    const p = doc.createElement("p");
    p.className = "pulse-field__hint";
    p.id = `${id}-hint`;
    p.textContent = hint;
    wrap.append(p);
    describedBy.push(p.id);
  }
  if (errorMessage) {
    const p = doc.createElement("p");
    p.className = "pulse-field__error";
    p.id = `${id}-error`;
    p.setAttribute("role", "alert");
    const text = doc.createElement("span");
    text.textContent = errorMessage;
    p.append(createIcon("cross", { doc }), text);
    wrap.append(p);
    wrap.dataset.invalid = "";
    input.setAttribute("aria-invalid", "true");
    describedBy.push(p.id);
  }
  if (describedBy.length) input.setAttribute("aria-describedby", describedBy.join(" "));
  return wrap;
}
