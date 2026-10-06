// Lesson 5: draw every spacing measurement on top of the page.
//
// The overlay is one fixed, click-through layer, clipped to the viewport and
// outside the page's flow. Turning it on cannot move anything it measures,
// which is what makes it a debug aid rather than part of the layout.
// Lesson 6: the toggle is now a createButton with the grid icon.
import { createButton } from "./components/button.js";
import { gridTracks, measureSpacing, summarizeSpacing } from "./spacing-audit.js";

export const OVERLAY_STORAGE_KEY = "pulse:spacing-overlay";

/** @typedef {{ on: boolean, measurements: import("./spacing-audit.js").Measurement[], summary: ReturnType<typeof summarizeSpacing> }} OverlayState */
/** @typedef {{ readonly state: OverlayState, setOn: (on: boolean) => void, toggle: () => void, refresh: () => void, subscribe: (fn: (s: OverlayState) => void) => () => void, layer: HTMLElement }} SpacingOverlay */

/** @param {Document} doc */
function safeStorage(doc) {
  try {
    return doc.defaultView?.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Label text: whole pixels on the grid, two decimals when it is off. @param {import("./spacing-audit.js").Measurement} m */
export function labelText(m) {
  const px = Math.abs(m.px);
  return m.status === "off-grid" ? String(+px.toFixed(2)) : String(Math.round(px));
}

/** @param {import("./spacing-audit.js").Box} a @param {import("./spacing-audit.js").Box} b */
const overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/** @param {Document} doc @param {import("./spacing-audit.js").Box} box @param {string} kind */
function region(doc, box, kind) {
  const el = doc.createElement("div");
  el.className = "pulse-spacing-region";
  el.dataset.kind = kind;
  el.style.left = `${box.left}px`;
  el.style.top = `${box.top}px`;
  el.style.width = `${box.right - box.left}px`;
  el.style.height = `${box.bottom - box.top}px`;
  return el;
}

/** What listeners care about. Same key, no notification: no feedback loops. @param {OverlayState} s */
const stateKey = (s) =>
  JSON.stringify([s.on, s.summary.total, s.summary.byKind, s.summary.offGrid.map((m) => [m.where, m.kind, m.side, labelText(m)])]);

/**
 * @param {{ doc?: Document, root?: Element, storage?: Storage | null }} [opts]
 * @returns {SpacingOverlay}
 */
export function createSpacingOverlay({ doc = document, root = doc.body, storage = safeStorage(doc) } = {}) {
  const win = /** @type {Window & typeof globalThis} */ (doc.defaultView);
  const layer = doc.createElement("div");
  layer.className = "pulse-spacing-overlay";
  layer.dataset.spacingOverlay = "";
  layer.setAttribute("aria-hidden", "true");
  layer.hidden = true;
  const plane = doc.createElement("div");
  plane.className = "pulse-spacing-plane";
  layer.append(plane);
  doc.body.append(layer);

  /** @type {Set<(s: OverlayState) => void>} */
  const listeners = new Set();
  /** @type {OverlayState} */
  let state = { on: false, measurements: [], summary: summarizeSpacing([]) };
  let lastKey = "";
  let frame = 0;

  const notify = () => {
    const key = stateKey(state);
    if (key === lastKey) return;
    lastKey = key;
    listeners.forEach((fn) => fn(state));
  };

  // The plane holds everything in document coordinates; scrolling only moves it.
  const follow = () => {
    plane.style.transform = `translate(${-win.scrollX}px, ${-win.scrollY}px)`;
  };

  function draw() {
    plane.replaceChildren();
    for (const grid of root.querySelectorAll(".pulse-grid")) {
      for (const track of gridTracks(grid).tracks) plane.append(region(doc, track, "column"));
    }
    // Labels are placed in priority order: off-grid first (a clash never hides
    // one), then gaps, then padding and margin. Every region is drawn; a
    // padding or margin value repeated on the same kind of element (every
    // table cell, every card) is labelled once, so labels don't bury the page.
    const rank = (/** @type {import("./spacing-audit.js").Measurement} */ m) => (m.status === "off-grid" ? 0 : m.kind === "gap" ? 1 : 2);
    const ordered = [...state.measurements].sort((a, b) => rank(a) - rank(b));
    /** @type {import("./spacing-audit.js").Box[]} */
    const placed = [];
    const labelled = new Set();
    for (const m of ordered) {
      const r = region(doc, m.box, m.kind);
      r.dataset.status = m.status;
      r.dataset.px = labelText(m);
      plane.append(r);
      if (m.status === "free") continue;
      const text = labelText(m);
      const repeat = m.status !== "off-grid" && m.kind !== "gap" ? `${m.where}|${m.kind}|${text}` : null;
      if (repeat && labelled.has(repeat)) continue;
      const [cx, cy] = [(m.box.left + m.box.right) / 2, (m.box.top + m.box.bottom) / 2];
      const half = { w: (text.length * 8 + 16) / 2, h: 10 };
      const spot = { left: cx - half.w, right: cx + half.w, top: cy - half.h, bottom: cy + half.h };
      if (placed.some((p) => overlaps(p, spot))) continue;
      placed.push(spot);
      if (repeat) labelled.add(repeat);
      const label = doc.createElement("span");
      label.className = "pulse-spacing-label";
      label.dataset.kind = m.kind;
      label.dataset.status = m.status;
      label.textContent = text;
      label.style.left = `${cx}px`;
      label.style.top = `${cy}px`;
      plane.append(label);
    }
    follow();
  }

  function refresh() {
    frame = 0;
    const measurements = measureSpacing(root, { ignore: (el) => layer.contains(el) });
    state = { on: state.on, measurements, summary: summarizeSpacing(measurements) };
    if (state.on) draw();
    notify();
  }
  const schedule = () => {
    if (!frame) frame = win.requestAnimationFrame(refresh);
  };

  /** @param {boolean} on */
  function setOn(on) {
    state = { ...state, on };
    layer.hidden = !on;
    try {
      storage?.setItem(OVERLAY_STORAGE_KEY, on ? "on" : "off");
    } catch {}
    if (on) draw();
    else plane.replaceChildren();
    notify();
  }

  win.addEventListener("scroll", follow, { passive: true });
  win.addEventListener("resize", schedule);
  new win.ResizeObserver(schedule).observe(root);
  // Re-measure when the page changes, but not when the overlay itself redraws.
  new win.MutationObserver((/** @type {MutationRecord[]} */ records) => {
    if (records.some((r) => !layer.contains(r.target))) schedule();
  }).observe(root, { subtree: true, childList: true, attributes: true, characterData: true });
  doc.fonts?.ready.then(schedule);

  refresh();
  let saved = null;
  try {
    saved = storage?.getItem(OVERLAY_STORAGE_KEY);
  } catch {}
  if (saved === "on") setOn(true);

  return {
    get state() {
      return state;
    },
    setOn,
    toggle: () => setOn(!state.on),
    refresh,
    subscribe(fn) {
      listeners.add(fn);
      fn(state);
      return () => listeners.delete(fn);
    },
    layer,
  };
}

/**
 * The on/off switch: a secondary createButton with aria-pressed. Its label
 * never changes, so pressing it moves nothing.
 * @param {HTMLElement} slot @param {SpacingOverlay} overlay
 */
export function mountSpacingToggle(slot, overlay) {
  const btn = createButton({ label: "Spacing overlay", icon: "grid", variant: "secondary", pressed: false, onClick: () => overlay.toggle(), doc: slot.ownerDocument });
  btn.dataset.spacingToggle = "";
  overlay.subscribe((s) => {
    const pressed = String(s.on);
    if (btn.getAttribute("aria-pressed") !== pressed) btn.setAttribute("aria-pressed", pressed);
  });
  slot.replaceChildren(btn);
  return btn;
}
