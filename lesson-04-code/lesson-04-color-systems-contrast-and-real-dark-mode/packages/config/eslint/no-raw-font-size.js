// pulse/no-raw-font-size, carried forward from Lesson 3: a font size is a
// type-scale role or a reset keyword, nothing else.

const ALLOWED = /^(?:var\(--pulse-font-size-(?:caption|body|subheading|heading|title|headline|display)\)|inherit|initial|unset|revert|revert-layer)$/;

/** @param {string} value */
export const isAllowedFontSize = (value) => ALLOWED.test(value.trim());

const message = (value) =>
  `font-size: ${value} is not on the type scale. Use var(--pulse-font-size-<role>) or a .pulse-text-<role> class.`;

/** @param {any} node */
const keyName = (node) => (node.type === "Identifier" ? node.name : node.type === "Literal" ? String(node.value) : null);

export default {
  meta: { type: "problem", docs: { description: "Font sizes must come from the type scale" }, schema: [] },
  create(context) {
    /** @param {any} node @param {any} valueNode */
    const checkJs = (node, valueNode) => {
      if (valueNode.type !== "Literal" && valueNode.type !== "TemplateLiteral") return;
      const value = valueNode.type === "Literal" ? String(valueNode.value) : context.sourceCode.getText(valueNode).slice(1, -1);
      if (!isAllowedFontSize(value)) context.report({ node, message: message(value) });
    };
    return {
      Declaration(node) {
        if (node.property.toLowerCase() !== "font-size") return;
        const value = context.sourceCode.getText(node.value);
        if (!isAllowedFontSize(value)) context.report({ node, message: message(value) });
      },
      Property(node) {
        const key = keyName(node.key);
        if (key === "fontSize" || key === "font-size") checkJs(node, node.value);
      },
      AssignmentExpression(node) {
        if (node.left.type === "MemberExpression" && keyName(node.left.property) === "fontSize") checkJs(node, node.right);
      },
    };
  },
};
