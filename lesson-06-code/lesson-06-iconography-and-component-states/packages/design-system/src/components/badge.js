// Lesson 6: status badges carry an icon as well as a colour, so "passed" and
// "failed" differ in shape, not only in hue.
import { createIcon } from "../icons/icon.js";

/** @typedef {"neutral" | "success" | "warning" | "danger"} Tone */
/** @type {Readonly<Record<Tone, string | null>>} */
export const TONE_ICON = Object.freeze({ neutral: null, success: "check", warning: "alert", danger: "cross" });

/**
 * Set a badge's tone and text. A no-op when nothing changed, so panels that
 * refresh often don't wake the spacing overlay's mutation observer.
 * @param {HTMLElement} el @param {string} tone @param {string} text
 */
export function updateBadge(el, tone, text) {
  if (el.dataset.tone === tone && el.textContent === text) return;
  el.dataset.tone = tone;
  const name = TONE_ICON[/** @type {Tone} */ (tone)] ?? null;
  const label = el.ownerDocument.createElement("span");
  label.textContent = text;
  el.replaceChildren(...(name ? [createIcon(name, { doc: el.ownerDocument })] : []), label);
}

/** @param {{ tone?: string, text: string, doc?: Document }} opts */
export function createBadge({ tone = "neutral", text, doc = document }) {
  const el = doc.createElement("span");
  el.className = "pulse-badge";
  updateBadge(el, tone, text);
  return el;
}
