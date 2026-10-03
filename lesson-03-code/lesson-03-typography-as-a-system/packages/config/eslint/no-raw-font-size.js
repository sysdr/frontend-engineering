// pulse/no-raw-font-size — Lesson 3's type-scale rule.
//
// The type scale lives in ONE file: packages/design-system/src/tokens/.
// Everywhere else, a text size must be a reference to a scale step:
//
//     font-size: var(--pulse-font-size-body);     OK
//     font-size: 15px;                           FAIL (rawFontSize)
//     el.style.fontSize = size;                   FAIL (dynamicFontSize)
//
// The same rule runs on two languages: on JavaScript through ESLint's own
// parser, and on CSS through @eslint/css. A visitor named after a node type
// only fires for the language that has that node type, so one rule object
// covers both.

const TOKEN_VALUE = /^var\(\s*--pulse-font-size-[a-z]+\s*\)$/;
const KEYWORDS = new Set(["inherit", "initial", "unset", "revert"]);
const INLINE_DECL = /(?:^|[;{\s"'])(font-size|font)\s*:\s*([^;}"'`]+)/gi;

export const DEFAULT_ALLOW = ["packages/design-system/src/tokens/"];

// Is this value a legal font-size? `font` (the shorthand) may only reset.
export function isAllowedValue(property, rawValue) {
  const value = String(rawValue).trim().replace(/\s*!important$/i, "").toLowerCase();
  if (KEYWORDS.has(value)) return true;
  return property.toLowerCase() === "font-size" && TOKEN_VALUE.test(value);
}

// Every `font-size: …` / `font: …` declaration written inside a string, e.g.
// an inline style attribute built in JS or an HTML template.
export function inlineDeclarations(text) {
  return [...String(text).matchAll(INLINE_DECL)].map((m) => ({ property: m[1], value: m[2].trim() }));
}

function isExempt(filename, allow) {
  const path = filename.split("\\").join("/");
  return allow.some((prefix) => path.includes(`/${prefix}`) || path.startsWith(prefix));
}

const staticString = (node) => {
  if (node?.type === "Literal" && typeof node.value === "string") return node.value;
  if (node?.type === "TemplateLiteral" && node.expressions.length === 0) return node.quasis[0].value.cooked;
  return null;
};

const keyName = (node) => (node.type === "Identifier" ? node.name : typeof node.value === "string" ? node.value : null);
const SIZE_KEYS = new Set(["fontSize", "font-size"]);

export const noRawFontSize = {
  meta: {
    type: "problem",
    docs: { description: "Text sizes must come from the Pulse type scale, never be typed by hand" },
    schema: [
      {
        type: "object",
        properties: { allow: { type: "array", items: { type: "string" } } },
        additionalProperties: false,
      },
    ],
    messages: {
      rawFontSize:
        "{{property}}: {{value}} is not on the type scale. Use var(--pulse-font-size-<role>); the scale lives in packages/design-system/src/tokens/typography.js.",
      dynamicFontSize:
        "This sets a font size from a computed value, which the type scale cannot check. Pick a role and use var(--pulse-font-size-<role>) instead.",
    },
  },

  create(context) {
    const allow = context.options[0]?.allow ?? DEFAULT_ALLOW;
    if (isExempt(context.filename, allow)) return {};

    const reportValue = (node, property, valueNode) => {
      const text = staticString(valueNode);
      if (text === null) return context.report({ node, messageId: "dynamicFontSize" });
      if (!isAllowedValue(property, text)) context.report({ node, messageId: "rawFontSize", data: { property, value: text } });
    };

    const scanString = (node, text) => {
      for (const decl of inlineDeclarations(text)) {
        if (!isAllowedValue(decl.property, decl.value)) {
          context.report({ node, messageId: "rawFontSize", data: decl });
        }
      }
    };

    return {
      // ---- CSS (@eslint/css) --------------------------------------------
      Declaration(node) {
        const property = node.property.toLowerCase();
        if (property !== "font-size" && property !== "font") return;
        const value = context.sourceCode.getText(node.value);
        if (!isAllowedValue(property, value)) {
          context.report({ node, messageId: "rawFontSize", data: { property, value: value.trim() } });
        }
      },

      // ---- JavaScript ---------------------------------------------------
      // { fontSize: "15px" } and { "font-size": "15px" }
      Property(node) {
        const name = keyName(node.key);
        if (SIZE_KEYS.has(name)) reportValue(node, "font-size", node.value);
      },
      // el.style.fontSize = "15px"
      AssignmentExpression(node) {
        const target = node.left;
        if (target.type === "MemberExpression" && !target.computed && target.property.name === "fontSize") {
          reportValue(node, "font-size", node.right);
        }
      },
      // style.setProperty("font-size", …) and setAttribute("font-size", …)
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "MemberExpression" || callee.computed) return;
        if (!["setProperty", "setAttribute"].includes(callee.property.name)) return;
        if (staticString(node.arguments[0])?.toLowerCase() !== "font-size") return;
        reportValue(node, "font-size", node.arguments[1]);
      },
      // "font-size: 15px" inside any string or template (inline styles)
      Literal(node) {
        if (typeof node.value === "string") scanString(node, node.value);
      },
      TemplateElement(node) {
        scanString(node, node.value.cooked ?? "");
      },
    };
  },
};
