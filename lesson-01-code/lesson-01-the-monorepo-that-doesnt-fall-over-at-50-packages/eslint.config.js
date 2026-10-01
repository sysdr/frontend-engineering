// Root ESLint flat config. Every package's `lint` script (`eslint src`)
// finds this file by walking up from its own folder.
import pulse from "./packages/config/eslint/index.js";

export default [
  { ignores: ["**/dist/**", "**/node_modules/**"] },
  {
    files: ["apps/*/src/**/*.js", "packages/*/src/**/*.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    plugins: { pulse },
    rules: { "pulse/no-cross-boundary-import": "error" },
  },
];
