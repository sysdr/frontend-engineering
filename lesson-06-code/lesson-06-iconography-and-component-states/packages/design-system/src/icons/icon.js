// Lesson 6: render an icon from the set. The attributes and shapes come from
// icons.js, which `pnpm tokens` generates from the .svg files in this folder.
import { ICONS } from "./icons.js";

const SVG_NS = "http://www.w3.org/2000/svg";

/** @typedef {keyof typeof ICONS} IconName */
export const ICON_NAMES = /** @type {IconName[]} */ (Object.keys(ICONS));

/**
 * An inline <svg> for one icon. Decorative by default (hidden from assistive
 * tech, because the text beside it carries the meaning); pass `label` when the
 * icon stands alone.
 * @param {string} name
 * @param {{ size?: number, label?: string, doc?: Document }} [opts]
 * @returns {SVGSVGElement}
 */
export function createIcon(name, { size = 16, label, doc = document } = {}) {
  const icon = ICONS[/** @type {IconName} */ (name)];
  if (!icon) throw new Error(`Unknown icon "${name}". The set has: ${ICON_NAMES.join(", ")}.`);
  const svg = /** @type {SVGSVGElement} */ (doc.createElementNS(SVG_NS, "svg"));
  for (const [k, v] of Object.entries(icon.attrs)) if (k !== "xmlns") svg.setAttribute(k, v);
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("class", "pulse-icon");
  svg.setAttribute("data-icon", name);
  if (label) {
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", label);
  } else {
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
  }
  svg.innerHTML = icon.body;
  return svg;
}
