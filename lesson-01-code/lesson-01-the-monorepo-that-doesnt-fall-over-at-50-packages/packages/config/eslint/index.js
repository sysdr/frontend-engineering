// The "pulse" ESLint plugin. Lives in @pulse/config because every team
// consumes it — so, per CODEOWNERS, every team approves changes to it.
import { noCrossBoundaryImport } from "./no-cross-boundary-import.js";

export default {
  meta: { name: "eslint-plugin-pulse", version: "0.1.0" },
  rules: { "no-cross-boundary-import": noCrossBoundaryImport },
};
