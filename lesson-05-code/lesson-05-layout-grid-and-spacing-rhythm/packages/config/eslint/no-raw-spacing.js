// pulse/no-raw-spacing (Lesson 5): margin, padding and gap come from the
// spacing scale. Allowed values: 0, auto, a reset keyword, and
// var(--pulse-space-N) or var(--pulse-layout-<role>), alone or combined in
// calc() with plain numbers (calc(var(--pulse-space-2) * -1)).

const CSS_PROP = /^(?:margin|padding|scroll-margin|scroll-padding)(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?$|^(?:gap|row-gap|column-gap|grid-gap|grid-row-gap|grid-column-gap)$/i;
const JS_PROP = /^(?:margin|padding)(?:Top|Right|Bottom|Left|Block|Inline)?(?:Start|End)?$|^(?:gap|rowGap|columnGap)$/;
const TOKEN = /^var\(--pulse-(?:space-\d+|layout-[a-z-]+)\)$/;
const TOKENS = /var\(--pulse-(?:space-\d+|layout-[a-z-]+)\)/g;
const KEYWORD = /^(?:0|auto|inherit|initial|unset|revert|revert-layer)$/;

/** Split "a calc(b c) d" on spaces that are not inside parentheses. @param {string} value */
function parts(value) {
  /** @type {string[]} */
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of value.trim()) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (/\s/.test(ch) && depth === 0) {
      if (cur) out.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

/** @param {string} part */
function isAllowedPart(part) {
  if (KEYWORD.test(part) || TOKEN.test(part)) return true;
  // calc() is fine when its only lengths are tokens: what is left must be plain numbers and operators.
  const calc = /^calc\((.*)\)$/.exec(part);
  if (!calc) return false;
  const rest = calc[1].replaceAll(TOKENS, "");
  return rest !== calc[1] && /^[\d\s.*+\-/()]*$/.test(rest);
}

/** @param {string} value */
export function isAllowedSpacing(value) {
  const p = parts(value);
  return p.length > 0 && p.every(isAllowedPart);
}

const message = (/** @type {string} */ prop, /** @type {string} */ value) =>
  `${prop}: ${value} is not on the spacing scale. Use var(--pulse-space-N) or var(--pulse-layout-<role>).`;

/** @param {any} node */
const keyName = (node) => (node.type === "Identifier" ? node.name : node.type === "Literal" ? String(node.value) : null);

// Inline CSS inside a JS string: "padding: 5px; color: ..."
const INLINE = /(?:^|[;{\s"'])((?:margin|padding|gap|row-gap|column-gap)(?:-[a-z-]+)?)\s*:\s*([^;"'}]+)/gi;

export default {
  meta: { type: "problem", docs: { description: "Spacing must come from the spacing scale" }, schema: [] },
  create(/** @type {any} */ context) {
    /** @param {any} node @param {string} prop @param {any} valueNode */
    const checkJsValue = (node, prop, valueNode) => {
      let value;
      if (valueNode.type === "Literal") value = String(valueNode.value);
      else if (valueNode.type === "TemplateLiteral" && valueNode.expressions.length === 0) value = valueNode.quasis[0].value.cooked;
      else return; // computed at runtime: the spacing overlay checks what it renders
      // A word with no number or function in it ({ padding: "Padding" }) is a label, not a length.
      if (typeof valueNode.value !== "number" && !/[\d(]/.test(value)) return;
      if (!isAllowedSpacing(value)) context.report({ node, message: message(prop, value) });
    };
    /** @param {any} node @param {string} text */
    const checkInline = (node, text) => {
      for (const [, prop, value] of text.matchAll(INLINE)) {
        if (CSS_PROP.test(prop) && !isAllowedSpacing(value)) context.report({ node, message: message(prop, value.trim()) });
      }
    };
    return {
      Declaration(/** @type {any} */ node) {
        if (!CSS_PROP.test(node.property)) return;
        const value = context.sourceCode.getText(node.value);
        if (!isAllowedSpacing(value)) context.report({ node, message: message(node.property, value) });
      },
      Property(/** @type {any} */ node) {
        const key = keyName(node.key);
        if (key && (JS_PROP.test(key) || CSS_PROP.test(key))) checkJsValue(node, key, node.value);
        else if (node.value.type === "Literal" && typeof node.value.value === "string") checkInline(node.value, node.value.value);
      },
      AssignmentExpression(/** @type {any} */ node) {
        const key = node.left.type === "MemberExpression" ? keyName(node.left.property) : null;
        if (key && JS_PROP.test(key)) checkJsValue(node, key, node.right);
      },
      CallExpression(/** @type {any} */ node) {
        // el.setAttribute("style", "padding: 5px")
        const [name, value] = node.arguments;
        if (node.callee.property?.name === "setAttribute" && name?.value === "style" && value?.type === "Literal") checkInline(value, String(value.value));
      },
    };
  },
};
