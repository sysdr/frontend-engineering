// The theme "context" for plain-DOM apps. One controller per page owns the
// user's choice (light, dark or system), resolves it to a real theme, and
// writes it to <html data-theme>. Generated CSS does the rest: every role
// variable changes at once, and no component has to know a theme exists.

/** @typedef {"light" | "dark" | "system"} ThemeChoice */
/** @typedef {"light" | "dark"} ResolvedTheme */
/**
 * @typedef {object} ThemeEnv
 * @property {HTMLElement | { dataset: Record<string, string | undefined> }} root
 * @property {{ getItem(k: string): string | null, setItem(k: string, v: string): void }} storage
 * @property {(q: string) => { matches: boolean, addEventListener(t: "change", f: () => void): void }} matchMedia
 * @property {(t: "storage", f: (e: { key: string | null, newValue: string | null }) => void) => void} onStorage
 */

export const THEME_CHOICES = /** @type {const} */ (["light", "dark", "system"]);
export const STORAGE_KEY = "pulse:theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/** @param {unknown} value @returns {value is ThemeChoice} */
export function isThemeChoice(value) {
  return typeof value === "string" && /** @type {readonly string[]} */ (THEME_CHOICES).includes(value);
}

/**
 * @param {ThemeChoice} choice
 * @param {boolean} systemPrefersDark
 * @returns {ResolvedTheme}
 */
export function resolveTheme(choice, systemPrefersDark) {
  if (choice === "system") return systemPrefersDark ? "dark" : "light";
  return choice;
}

/** @param {ThemeEnv} env */
export function createThemeController(env) {
  const media = env.matchMedia(DARK_QUERY);
  const stored = safeGet(env.storage);
  /** @type {ThemeChoice} */
  let choice = isThemeChoice(stored) ? stored : "system";
  /** @type {Set<(state: { choice: ThemeChoice, theme: ResolvedTheme }) => void>} */
  const listeners = new Set();

  const state = () => ({ choice, theme: resolveTheme(choice, media.matches) });

  function apply() {
    const s = state();
    env.root.dataset.theme = s.theme;
    env.root.dataset.themeChoice = s.choice;
    listeners.forEach((fn) => fn(s));
  }

  // The OS setting only matters while the user has picked "system".
  media.addEventListener("change", () => {
    if (choice === "system") apply();
  });

  // Another tab (the invoice list, say) changed the theme: follow it.
  env.onStorage("storage", (e) => {
    if (e.key === STORAGE_KEY && isThemeChoice(e.newValue) && e.newValue !== choice) {
      choice = e.newValue;
      apply();
    }
  });

  apply();

  return {
    get: state,
    /** @param {ThemeChoice} next */
    set(next) {
      if (!isThemeChoice(next)) throw new Error(`Unknown theme "${next}"`);
      choice = next;
      safeSet(env.storage, next);
      apply();
    },
    /** @param {(state: { choice: ThemeChoice, theme: ResolvedTheme }) => void} fn */
    subscribe(fn) {
      listeners.add(fn);
      fn(state());
      return () => listeners.delete(fn);
    },
  };
}

/** @param {ThemeEnv["storage"]} storage */
function safeGet(storage) {
  try {
    return storage.getItem(STORAGE_KEY);
  } catch {
    return null; // storage blocked (private mode, sandboxed iframe): fall back to "system"
  }
}

/** @param {ThemeEnv["storage"]} storage @param {string} value */
function safeSet(storage, value) {
  try {
    storage.setItem(STORAGE_KEY, value);
  } catch {
    // Still themed for this page; only persistence is lost.
  }
}

/** The controller wired to a real browser window. */
export function browserThemeController() {
  return createThemeController({
    root: document.documentElement,
    storage: window.localStorage,
    matchMedia: (q) => window.matchMedia(q),
    onStorage: (type, fn) => window.addEventListener(type, fn),
  });
}

const LABELS = { light: "Light", dark: "Dark", system: "System" };

/**
 * A three-way switch built from native radio buttons, so arrow keys, Tab and
 * screen readers work with no extra code.
 * @param {HTMLElement} container
 * @param {ReturnType<typeof createThemeController>} controller
 */
export function mountThemeSwitcher(container, controller) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "pulse-theme-switch";
  fieldset.dataset.themeSwitch = "";
  const legend = document.createElement("legend");
  legend.className = "pulse-visually-hidden";
  legend.textContent = "Colour theme";
  fieldset.append(legend);

  for (const choice of THEME_CHOICES) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "pulse-theme";
    input.value = choice;
    input.addEventListener("change", () => controller.set(choice));
    label.append(input, document.createTextNode(LABELS[choice]));
    fieldset.append(label);
  }

  const note = document.createElement("span");
  note.className = "pulse-theme-note pulse-text-caption";
  note.dataset.themeNote = "";
  note.setAttribute("aria-live", "polite");

  container.replaceChildren(fieldset, note);
  controller.subscribe(({ choice, theme }) => {
    for (const input of fieldset.querySelectorAll("input")) input.checked = input.value === choice;
    note.textContent = choice === "system" ? `Following your system: ${theme}` : "";
  });
}
