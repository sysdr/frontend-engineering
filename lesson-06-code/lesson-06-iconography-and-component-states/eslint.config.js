import js from "@eslint/js";
import css from "@eslint/css";
import globals from "globals";
import pulse from "./packages/config/eslint/index.js";

const TOKENS = "packages/design-system/src/tokens/**";
const PULSE_RULES = { "pulse/no-raw-color": "error", "pulse/no-raw-font-size": "error", "pulse/no-raw-spacing": "error" };
const PULSE_OFF = { "pulse/no-raw-color": "off", "pulse/no-raw-font-size": "off", "pulse/no-raw-spacing": "off" };

export default [
  { ignores: ["**/node_modules/**", "**/dist/**", ".turbo/**", "test-results/**", "playwright-report/**"] },
  {
    files: ["**/*.{js,mjs}"],
    ...js.configs.recommended,
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: { ...globals.browser, ...globals.node } },
    plugins: { pulse },
    rules: { ...js.configs.recommended.rules, "no-empty": ["error", { allowEmptyCatch: true }], ...PULSE_RULES },
  },
  {
    files: ["**/*.css"],
    language: "css/css",
    plugins: { css, pulse },
    rules: PULSE_RULES,
  },
  // The token folder defines the values, so it is the one exemption.
  { files: [TOKENS], rules: PULSE_OFF },
  // Rule tests contain bad values on purpose.
  { files: ["tests/**"], rules: PULSE_OFF },
];
