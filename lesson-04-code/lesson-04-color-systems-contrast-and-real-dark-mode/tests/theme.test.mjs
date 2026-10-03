import { describe, expect, it } from "vitest";
import { STORAGE_KEY, createThemeController, resolveTheme } from "../packages/design-system/src/theme.js";

/** A fake browser: storage, a controllable media query, and a storage-event bus. */
function fakeEnv({ stored = null, dark = false } = {}) {
  const store = new Map(stored ? [[STORAGE_KEY, stored]] : []);
  const media = { matches: dark, listeners: [], addEventListener: (_t, f) => media.listeners.push(f) };
  const storageListeners = [];
  const root = { dataset: {} };
  return {
    root,
    store,
    setSystemDark(v) {
      media.matches = v;
      media.listeners.forEach((f) => f());
    },
    otherTabWrites(v) {
      store.set(STORAGE_KEY, v);
      storageListeners.forEach((f) => f({ key: STORAGE_KEY, newValue: v }));
    },
    env: {
      root,
      storage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
      matchMedia: () => media,
      onStorage: (_t, f) => storageListeners.push(f),
    },
  };
}

describe("theme resolution", () => {
  it("maps system to the OS setting and leaves explicit choices alone", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
  });
});

describe("the theme controller", () => {
  it("defaults to system and writes the resolved theme to <html>", () => {
    const f = fakeEnv({ dark: true });
    const t = createThemeController(f.env);
    expect(t.get()).toEqual({ choice: "system", theme: "dark" });
    expect(f.root.dataset).toEqual({ theme: "dark", themeChoice: "system" });
  });

  it("persists an explicit choice", () => {
    const f = fakeEnv();
    createThemeController(f.env).set("dark");
    expect(f.store.get(STORAGE_KEY)).toBe("dark");
    expect(f.root.dataset.theme).toBe("dark");
    expect(createThemeController(f.env).get().choice).toBe("dark");
  });

  it("follows the OS only while the choice is system", () => {
    const f = fakeEnv({ dark: false });
    const t = createThemeController(f.env);
    f.setSystemDark(true);
    expect(f.root.dataset.theme).toBe("dark");
    t.set("light");
    f.setSystemDark(false);
    f.setSystemDark(true);
    expect(f.root.dataset.theme).toBe("light");
  });

  it("follows a change made in another tab", () => {
    const f = fakeEnv();
    const seen = [];
    createThemeController(f.env).subscribe((s) => seen.push(s.theme));
    f.otherTabWrites("dark");
    expect(f.root.dataset.theme).toBe("dark");
    expect(seen).toEqual(["light", "dark"]);
  });

  it("ignores garbage in storage and rejects unknown themes", () => {
    const f = fakeEnv({ stored: "purple" });
    const t = createThemeController(f.env);
    expect(t.get().choice).toBe("system");
    expect(() => t.set(/** @type {any} */ ("sepia"))).toThrow(/Unknown theme/);
  });

  it("still themes the page when storage is blocked", () => {
    const f = fakeEnv();
    f.env.storage = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    const t = createThemeController(f.env);
    t.set("dark");
    expect(f.root.dataset.theme).toBe("dark");
  });
});
