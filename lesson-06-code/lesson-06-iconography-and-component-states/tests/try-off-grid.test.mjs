// Lesson 5: the demo script switches the spacing reset off and back on exactly.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FILE, disableReset, enableReset, isResetOn } from "../scripts/try-off-grid.mjs";

describe("try-off-grid", () => {
  const css = readFileSync(FILE, "utf-8");
  it("finds the reset switched on in the committed base.css", () => expect(isResetOn(css)).toBe(true));
  it("switches it off, idempotently", () => {
    const off = disableReset(css);
    expect(isResetOn(off)).toBe(false);
    expect(disableReset(off)).toBe(off);
  });
  it("restores the file byte for byte", () => expect(enableReset(disableReset(css))).toBe(css));
});
