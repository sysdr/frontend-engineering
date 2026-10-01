import { test } from "node:test";
import assert from "node:assert/strict";
import { navigation } from "../dist/index.js";

test("shell lists the three product areas", () => {
  assert.deepEqual(navigation.map((n) => n.id), ["billing", "analytics", "admin"]);
});
