// @vitest-environment jsdom
// Lesson 6: the primitives, built in a real DOM (jsdom). Accessible names,
// wiring, and the data-state hook the gallery uses.
import { describe, expect, it } from "vitest";
import { createBadge, updateBadge } from "../packages/design-system/src/components/badge.js";
import { createButton } from "../packages/design-system/src/components/button.js";
import { createFormField } from "../packages/design-system/src/components/form-field.js";
import { STATES, sameLooking } from "../packages/design-system/src/components/states.js";
import { createIcon } from "../packages/design-system/src/icons/icon.js";

describe("createIcon", () => {
  it("renders the set's attributes and shapes, hidden from assistive tech by default", () => {
    const svg = createIcon("refresh", { size: 16 });
    expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(svg.getAttribute("stroke-width")).toBe("2");
    expect(svg.getAttribute("width")).toBe("16");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.querySelectorAll("path, polyline")).toHaveLength(2);
  });
  it("becomes an image with a name when given a label", () => {
    const svg = createIcon("check", { label: "Passed" });
    expect([svg.getAttribute("role"), svg.getAttribute("aria-label"), svg.hasAttribute("aria-hidden")]).toEqual(["img", "Passed", false]);
  });
  it("refuses an icon that isn't in the set", () => {
    expect(() => createIcon("rocket")).toThrow(/Unknown icon "rocket"/);
  });
});

describe("createButton", () => {
  it("throws without a label, because the label is the accessible name", () => {
    expect(() => createButton({ label: "" })).toThrow(/requires a string `label`/);
  });
  it("is a real type=button with its variant, icon and text", () => {
    const btn = createButton({ label: "Rebuild", icon: "refresh" });
    expect([btn.tagName, btn.type, btn.dataset.variant, btn.textContent]).toEqual(["BUTTON", "button", "primary", "Rebuild"]);
    expect(btn.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
  it("uses the native disabled attribute, so a disabled button never fires", () => {
    let clicks = 0;
    const btn = createButton({ label: "Save", disabled: true, onClick: () => clicks++ });
    document.body.append(btn);
    btn.click();
    expect([btn.disabled, clicks]).toEqual([true, 0]);
  });
  it("exposes a toggle with aria-pressed", () => {
    expect(createButton({ label: "Spacing overlay", variant: "secondary", pressed: false }).getAttribute("aria-pressed")).toBe("false");
  });
  it("pins hover, focus or active with data-state, and nothing else", () => {
    expect(createButton({ label: "Rebuild", state: "hover" }).dataset.state).toBe("hover");
    // @ts-expect-error: "disabled" is a real state, not a forced one
    expect(() => createButton({ label: "Rebuild", state: "disabled" })).toThrow(/Only hover, focus and active/);
  });
});

describe("createFormField", () => {
  it("connects the label to the input with a real for/id pair", () => {
    const field = createFormField({ label: "Invoice amount (USD)" });
    const input = /** @type {HTMLInputElement} */ (field.querySelector("input"));
    expect(field.querySelector("label")?.htmlFor).toBe(input.id);
  });
  it("wires hint and error through aria-describedby, with the cross icon on the error", () => {
    const field = createFormField({ label: "Amount", hint: "In US dollars.", errorMessage: "Enter an amount above zero." });
    const input = /** @type {HTMLInputElement} */ (field.querySelector("input"));
    const error = /** @type {HTMLElement} */ (field.querySelector('[role="alert"]'));
    expect(input.getAttribute("aria-describedby")).toBe(`${input.id}-hint ${input.id}-error`);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect([error.textContent, error.querySelector("svg")?.dataset.icon]).toEqual(["Enter an amount above zero.", "cross"]);
  });
  it("disables the input itself and can pin a state on it", () => {
    expect(/** @type {HTMLInputElement} */ (createFormField({ label: "Amount", disabled: true }).querySelector("input")).disabled).toBe(true);
    expect(/** @type {HTMLInputElement} */ (createFormField({ label: "Amount", state: "focus" }).querySelector("input")).dataset.state).toBe("focus");
  });
});

describe("badges and the look-alike check", () => {
  it("puts the tone's icon in the badge and swaps it when the tone changes", () => {
    const b = createBadge({ tone: "success", text: "Passed" });
    expect(b.querySelector("svg")?.dataset.icon).toBe("check");
    updateBadge(b, "danger", "Failed");
    expect([b.querySelector("svg")?.dataset.icon, b.textContent]).toEqual(["cross", "Failed"]);
  });
  it("names exactly the states that look the same", () => {
    expect(STATES).toEqual(["default", "hover", "focus", "active", "disabled"]);
    expect(sameLooking({ default: "a", hover: "b", focus: "c", active: "d", disabled: "a" })).toEqual([["default", "disabled"]]);
    expect(sameLooking({ default: "a", hover: "b", focus: "c", active: "d", disabled: "e" })).toEqual([]);
  });
});
