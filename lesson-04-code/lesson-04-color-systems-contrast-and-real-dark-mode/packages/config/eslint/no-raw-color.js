// pulse/no-raw-color: components name colour ROLES, never colour values.
// Runs on CSS (via @eslint/css) and on JavaScript. The token folder is the
// one place allowed to hold a colour literal, and eslint.config.js exempts it.

const HEX = /(?<![\w&])#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})(?![\w-])/i;
const COLOR_FN = /(?<![\w-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;
// CSS named colours (the commonly typed ones, plus every grey/gray spelling).
const NAMED = new Set(
  (
    "black white red green blue yellow orange purple pink brown gray grey silver gold navy teal " +
    "maroon olive lime aqua cyan magenta fuchsia indigo violet crimson coral salmon tomato " +
    "khaki beige ivory lavender plum orchid tan turquoise chocolate firebrick darkgray darkgrey " +
    "lightgray lightgrey dimgray dimgrey slategray slategrey whitesmoke gainsboro snow azure"
  ).split(" "),
);
const WORD = /(?<![\w-])[a-z]+(?![\w-])/gi;

/** @param {string} value */
export function findRawColor(value) {
  const clean = value.replace(/\/\*[\s\S]*?\*\//g, "");
  const hex = HEX.exec(clean);
  if (hex) return hex[0];
  const fn = COLOR_FN.exec(clean);
  if (fn) return fn[0].slice(0, -1) + "()";
  for (const [word] of clean.matchAll(WORD)) if (NAMED.has(word.toLowerCase())) return word;
  return null;
}

/** @param {string} found */
const message = (found) =>
  `${found} is a raw colour. Use a role: var(--pulse-color-<role>), defined in packages/design-system/src/tokens/colors.js.`;

export default {
  meta: {
    type: "problem",
    docs: { description: "Disallow colour literals outside the design-system token folder" },
    schema: [],
  },
  create(context) {
    const report = (node, found) => context.report({ node, message: message(found) });
    return {
      // CSS
      Declaration(node) {
        const found = findRawColor(context.sourceCode.getText(node.value));
        if (found) report(node, found);
      },
      // JavaScript: hex and colour functions in strings. Named colours are
      // left alone in JS, where "red" is far more often a word than a colour.
      Literal(node) {
        if (typeof node.value !== "string") return;
        const found = HEX.exec(node.value)?.[0] ?? COLOR_FN.exec(node.value)?.[0];
        if (found) report(node, found);
      },
      TemplateElement(node) {
        const found = HEX.exec(node.value.raw)?.[0] ?? COLOR_FN.exec(node.value.raw)?.[0];
        if (found) report(node, found);
      },
    };
  },
};
