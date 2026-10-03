// Runtime check that what the browser actually renders is on the scale.
// The lint rule stops a raw size from being WRITTEN; this catches one that
// sneaks in anyway (an inline style, a third-party stylesheet, a default the
// browser applies to an element nobody styled). Used by the invoice list's
// "Show type roles" button and by the Control Tower's type-scale panel.
import { typeScale } from "./tokens/typography.js";

export function matchRole(px, scale = typeScale, tolerance = 0.05) {
  return scale.find((s) => Math.abs(s.sizePx - px) <= tolerance) ?? null;
}

// Every element that directly holds text. A subtree marked data-audit-skip
// is left out on purpose (nothing in Lesson 3 needs it; it exists so a
// future specimen of an unshipped size can opt out honestly).
export function textElements(root) {
  const found = new Set();
  const walker = root.ownerDocument.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const host = node.parentElement;
    if (!host || !node.textContent.trim()) continue;
    if (host.closest("script, style, template, [data-audit-skip]")) continue;
    found.add(host);
  }
  return [...found];
}

export function auditTextSizes(root, { getStyle = (el) => getComputedStyle(el), scale = typeScale } = {}) {
  const byRole = Object.fromEntries(scale.map((s) => [s.role, 0]));
  const entries = textElements(root).map((element) => {
    const px = Number.parseFloat(getStyle(element).fontSize);
    const role = matchRole(px, scale)?.role ?? null;
    if (role) byRole[role] += 1;
    return { element, px, role, text: element.textContent.trim().slice(0, 40) };
  });
  const offScale = entries.filter((e) => e.role === null);
  return { total: entries.length, onScale: entries.length - offScale.length, offScale, byRole, entries };
}
