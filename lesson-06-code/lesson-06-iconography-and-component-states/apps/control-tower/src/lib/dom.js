// Small DOM helpers the panels share.
import { createBadge } from "@pulse/design-system";

/**
 * @param {string} tag
 * @param {Record<string, any>} [attrs]
 * @param {...any} children
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  el.append(...children.flat().filter((c) => c != null && c !== false));
  return el;
}

const SVG_NS = "http://www.w3.org/2000/svg";
/**
 * @param {string} tag
 * @param {Record<string, any>} [attrs]
 * @param {...any} children
 */
export function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, String(v));
  }
  el.append(...children.flat().filter((c) => c != null && c !== false));
  return el;
}

/** @param {string} selector @param {ParentNode} [root] @returns {HTMLElement} */
export function $(selector, root = document) {
  const el = root.querySelector(selector);
  if (!(el instanceof HTMLElement)) throw new Error(`Missing ${selector}`);
  return el;
}

/** A status badge with its tone's icon (Lesson 6). @param {string} tone @param {string} text @param {Record<string, any>} [attrs] */
export function badge(tone, text, attrs = {}) {
  const el = createBadge({ tone, text });
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/** A panel's header row: title on the left, status badges and actions on the right. @param {string} id @param {string} title @param {...Node} extra */
export function panelHead(id, title, ...extra) {
  return h(
    "header",
    { class: "panel-head" },
    h("h2", { id, class: "pulse-text-subheading" }, title),
    extra.length ? h("div", { class: "pulse-cluster-1" }, ...extra) : null,
  );
}

/** @param {string} path */
export async function getJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} failed with ${res.status}`);
  return res.json();
}

/** @param {string} path */
export async function getText(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} failed with ${res.status}`);
  return res.text();
}
