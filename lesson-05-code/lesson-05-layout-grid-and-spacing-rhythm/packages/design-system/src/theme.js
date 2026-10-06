// Carried forward from Lesson 4: the theme "context" for plain-DOM apps.
// One controller per page owns the user's choice (light, dark or system),
// resolves it to a real theme, and writes it to <html data-theme>. Generated
// CSS does the rest: every role variable changes at once.

export const THEME_STORAGE_KEY = "pulse:theme";
/** @typedef {"light" | "dark" | "system"} ThemeChoice */
/** @type {readonly ThemeChoice[]} */
export const THEME_CHOICES = Object.freeze(["light", "dark", "system"]);

/** @typedef {{ choice: ThemeChoice, resolved: "light" | "dark" }} ThemeState */
/** @typedef {{ readonly state: ThemeState, set: (c: ThemeChoice) => void, subscribe: (fn: (s: ThemeState) => void) => () => void }} ThemeController */

/** @param {unknown} v @returns {v is ThemeChoice} */
const isChoice = (v) => typeof v === "string" && /** @type {readonly string[]} */ (THEME_CHOICES).includes(v);

/**
 * @param {{
 *   storage: Pick<Storage, "getItem" | "setItem"> | null,
 *   media: { matches: boolean, addEventListener: (t: "change", fn: () => void) => void },
 *   root: HTMLElement,
 *   onExternalChange?: (fn: (choice: string | null) => void) => void,
 * }} deps
 * @returns {ThemeController}
 */
export function createThemeController({ storage, media, root, onExternalChange }) {
  /** @type {Set<(s: ThemeState) => void>} */
  const listeners = new Set();
  let stored = null;
  try {
    stored = storage?.getItem(THEME_STORAGE_KEY) ?? null;
  } catch {}
  /** @type {ThemeChoice} */
  let choice = isChoice(stored) ? stored : "system";

  /** @returns {ThemeState} */
  const compute = () => ({ choice, resolved: choice === "system" ? (media.matches ? "dark" : "light") : choice });
  let state = compute();

  const apply = () => {
    state = compute();
    root.dataset.theme = state.resolved;
    listeners.forEach((fn) => fn(state));
  };

  media.addEventListener("change", () => {
    if (choice === "system") apply();
  });
  // Another tab changed the theme: follow it.
  onExternalChange?.((value) => {
    choice = isChoice(value) ? value : "system";
    apply();
  });
  apply();

  return {
    get state() {
      return state;
    },
    set(next) {
      choice = next;
      try {
        storage?.setItem(THEME_STORAGE_KEY, next);
      } catch {}
      apply();
    },
    subscribe(fn) {
      listeners.add(fn);
      fn(state);
      return () => listeners.delete(fn);
    },
  };
}

/** The controller wired to the real browser: localStorage, matchMedia, storage events. */
export function browserThemeController(doc = document) {
  const win = /** @type {Window} */ (doc.defaultView);
  let storage = null;
  try {
    storage = win.localStorage;
  } catch {}
  return createThemeController({
    storage,
    media: win.matchMedia("(prefers-color-scheme: dark)"),
    root: doc.documentElement,
    onExternalChange: (fn) =>
      win.addEventListener("storage", (e) => {
        if (e.key === THEME_STORAGE_KEY) fn(e.newValue);
      }),
  });
}

const LABELS = /** @type {const} */ ({ light: "Light", dark: "Dark", system: "System" });

/**
 * Three native radios drawn as one segmented control, plus a status line.
 * @param {HTMLElement} slot @param {ThemeController} controller
 */
export function mountThemeSwitcher(slot, controller) {
  const doc = slot.ownerDocument;
  const wrap = doc.createElement("div");
  wrap.className = "pulse-theme-switch pulse-cluster-2";
  const set = doc.createElement("fieldset");
  set.className = "pulse-segmented";
  const legend = doc.createElement("legend");
  legend.className = "pulse-visually-hidden";
  legend.textContent = "Theme";
  set.append(legend);
  /** @type {HTMLInputElement[]} */
  const inputs = [];
  for (const c of THEME_CHOICES) {
    const label = doc.createElement("label");
    const input = doc.createElement("input");
    input.type = "radio";
    input.name = "pulse-theme";
    input.value = c;
    input.className = "pulse-visually-hidden";
    input.addEventListener("change", () => controller.set(c));
    const text = doc.createElement("span");
    text.textContent = LABELS[c];
    label.append(input, text);
    set.append(label);
    inputs.push(input);
  }
  const status = doc.createElement("span");
  status.className = "pulse-text-caption pulse-muted";
  status.dataset.themeStatus = "";
  wrap.append(set, status);
  slot.replaceChildren(wrap);

  controller.subscribe((s) => {
    for (const input of inputs) input.checked = input.value === s.choice;
    const text = s.choice === "system" ? `Following your system: ${s.resolved}` : `${LABELS[s.choice]} theme`;
    if (status.textContent !== text) status.textContent = text;
  });
  return wrap;
}
