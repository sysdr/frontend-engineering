// Carried forward from Lesson 4: the theme controller, with fake browser parts.
import { describe, expect, it } from "vitest";
import { createThemeController } from "../packages/design-system/src/theme.js";

function setup(stored = null, dark = false) {
  const data = new Map(stored ? [["pulse:theme", stored]] : []);
  const storage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
  /** @type {(() => void)[]} */
  const mediaFns = [];
  const media = { matches: dark, addEventListener: (_t, fn) => mediaFns.push(fn) };
  /** @type {((v: string | null) => void)[]} */
  const external = [];
  const root = /** @type {any} */ ({ dataset: {} });
  const c = createThemeController({ storage, media, root, onExternalChange: (fn) => external.push(fn) });
  return { c, data, media, mediaFns, external, root };
}

describe("theme controller", () => {
  it("defaults to system and follows the OS", () => {
    const t = setup(null, true);
    expect(t.c.state).toEqual({ choice: "system", resolved: "dark" });
    expect(t.root.dataset.theme).toBe("dark");
  });
  it("saves an explicit choice", () => {
    const t = setup();
    t.c.set("dark");
    expect(t.data.get("pulse:theme")).toBe("dark");
    expect(t.root.dataset.theme).toBe("dark");
  });
  it("tracks OS changes only while on system", () => {
    const t = setup();
    t.media.matches = true;
    t.mediaFns.forEach((f) => f());
    expect(t.root.dataset.theme).toBe("dark");
    t.c.set("light");
    t.mediaFns.forEach((f) => f());
    expect(t.root.dataset.theme).toBe("light");
  });
  it("follows a choice made in another tab", () => {
    const t = setup();
    t.external.forEach((f) => f("dark"));
    expect(t.c.state.choice).toBe("dark");
  });
});
