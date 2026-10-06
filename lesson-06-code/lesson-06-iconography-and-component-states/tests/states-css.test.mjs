// Lesson 6: the gallery can't drift from the real controls. Every pinned
// state shares one CSS rule with the pseudo-class a person triggers, and the
// disabled look carries a cue that isn't colour.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FILE, flatten, isDisabledStyled, unflatten } from "../scripts/try-flat-disabled.mjs";

const css = readFileSync(FILE, "utf-8").replace(/\/\*[\s\S]*?\*\//g, "");
/** Every rule as [selectors, body]. */
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => [sel.split(",").map((s) => s.trim()), body]);
const PSEUDO = { hover: ":hover:not(:disabled)", focus: ":focus-visible", active: ":active:not(:disabled)" };

describe("components.css", () => {
  for (const base of [".pulse-button", ".pulse-field__input"]) {
    for (const [state, pseudo] of Object.entries(PSEUDO)) {
      it(`draws ${base} ${state} and its pinned twin with the same rule`, () => {
        const rule = rules.find(([sels]) => sels.includes(`${base}${pseudo}`));
        expect(rule, `${base}${pseudo}`).toBeDefined();
        expect(rule?.[0]).toContain(`${base}[data-state="${state}"]`);
      });
    }
  }

  it("gives both primitives one disabled rule with a dashed edge", () => {
    const rule = rules.find(([sels]) => sels.includes(".pulse-button:disabled"));
    expect(rule?.[0]).toEqual([".pulse-button:disabled", ".pulse-field__input:disabled"]);
    expect(rule?.[1]).toMatch(/--c-border-style:\s*dashed/);
    expect(rule?.[1]).toMatch(/--c-bg:\s*var\(--pulse-color-surface-sunken\)/);
  });
});

describe("try-flat-disabled", () => {
  const raw = readFileSync(FILE, "utf-8");
  it("finds the disabled rule switched on", () => expect(isDisabledStyled(raw)).toBe(true));
  it("switches it off, idempotently, and restores it byte for byte", () => {
    const flat = flatten(raw);
    expect(isDisabledStyled(flat)).toBe(false);
    expect(flatten(flat)).toBe(flat);
    expect(unflatten(flat)).toBe(raw);
  });
});
