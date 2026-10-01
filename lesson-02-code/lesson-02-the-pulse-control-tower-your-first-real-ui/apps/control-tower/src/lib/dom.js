// One tiny helper instead of a framework: create an element (HTML or SVG)
// with attributes and optional text. React arrives in Lesson 13.
const SVG_NS = "http://www.w3.org/2000/svg";

export function el(tag, attrs = {}, text) {
  const node = tag.startsWith("svg:") ? document.createElementNS(SVG_NS, tag.slice(4)) : document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    node.setAttribute(key, value === true ? "" : String(value));
  }
  if (text !== undefined) node.textContent = text;
  return node;
}
