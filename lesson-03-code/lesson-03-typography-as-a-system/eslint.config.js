// Root ESLint flat config. Every package's `lint` script (`eslint src`)
// finds this file by walking up from its own folder.
// Lesson 3: CSS is linted too (via @eslint/css), and both languages run
// pulse/no-raw-font-size. The token folder is the one place exempt from it.
import css from "@eslint/css";
import pulse from "./packages/config/eslint/index.js";

export default [
  { ignores: ["**/dist/**", "**/node_modules/**"] },
  {
    files: ["apps/*/src/**/*.js", "packages/*/src/**/*.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    plugins: { pulse },
    rules: {
      "pulse/no-cross-boundary-import": "error",
      "pulse/no-raw-font-size": "error",
    },
  },
  {
    files: ["apps/*/src/**/*.css", "packages/*/src/**/*.css"],
    language: "css/css",
    plugins: { css, pulse },
    rules: { "pulse/no-raw-font-size": "error" },
  },
];
