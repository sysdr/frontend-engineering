// The "pulse" ESLint plugin. Lives in @pulse/config because every team
// consumes it — so, per CODEOWNERS, every team approves changes to it.
// Lesson 3 adds no-raw-font-size, which runs on JavaScript AND CSS.
import { noCrossBoundaryImport } from "./no-cross-boundary-import.js";
import { noRawFontSize } from "./no-raw-font-size.js";

export default {
  meta: { name: "eslint-plugin-pulse", version: "0.2.0" },
  rules: {
    "no-cross-boundary-import": noCrossBoundaryImport,
    "no-raw-font-size": noRawFontSize,
  },
};
