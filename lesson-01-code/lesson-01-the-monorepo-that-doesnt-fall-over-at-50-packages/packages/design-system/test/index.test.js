import { test } from "node:test";
import assert from "node:assert/strict";
import { formatMoney } from "../dist/index.js";

test("formatMoney uses the platform locale and currency", () => {
  assert.equal(formatMoney(123456), "$1,234.56");
});
