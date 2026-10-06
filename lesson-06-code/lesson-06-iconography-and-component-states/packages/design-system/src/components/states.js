// Lesson 6: the five states every interactive primitive designs for.
// Default and disabled are real. Hover, focus and active only happen while a
// person is touching the control, so the state gallery pins them with
// data-state, through the very same CSS rule the real pseudo-class uses.

export const STATES = Object.freeze(["default", "hover", "focus", "active", "disabled"]);
/** @typedef {"hover" | "focus" | "active"} ForcedState */
/** @type {readonly ForcedState[]} */
export const FORCED_STATES = Object.freeze(["hover", "focus", "active"]);

/** @param {unknown} s @returns {s is ForcedState} */
export const isForcedState = (s) => typeof s === "string" && /** @type {readonly string[]} */ (FORCED_STATES).includes(s);

/** What you can see of a state at a glance. Cursor is left out on purpose: it only shows once the pointer is already there. */
export const STATE_PROPERTIES = Object.freeze([
  "background-color",
  "color",
  "border-top-color",
  "border-top-style",
  "outline-style",
  "outline-color",
  "transform",
]);

/**
 * What a state looks like, as one comparable string.
 * @param {Element} el
 */
export function stateSignature(el) {
  const cs = /** @type {Window} */ (el.ownerDocument.defaultView).getComputedStyle(el);
  return STATE_PROPERTIES.map((p) => cs.getPropertyValue(p)).join(" | ");
}

/**
 * Compare the five states of one primitive. Returns the pairs that look the
 * same; an empty list means every state is visibly its own.
 * @param {Record<string, string>} signatures state -> stateSignature
 * @returns {[string, string][]}
 */
export function sameLooking(signatures) {
  const names = Object.keys(signatures);
  /** @type {[string, string][]} */
  const same = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) if (signatures[names[i]] === signatures[names[j]]) same.push([names[i], names[j]]);
  }
  return same;
}
