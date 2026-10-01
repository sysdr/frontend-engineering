import { test } from "node:test";
import assert from "node:assert/strict";
import { platformConfig } from "../dist/index.js";

test("config is frozen and USD", () => {
  assert.equal(platformConfig.currency, "USD");
  assert.ok(Object.isFrozen(platformConfig));
});
