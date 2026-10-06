// pulse/no-raw-color, carried forward from Lesson 4: colours come from roles.
// No hex, rgb()/hsl()/... or named colour outside the token folder.

const HEX = /(?<![\w&-])#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})(?![\w-])/i;
const FN = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;
const NAMED = new Set(
  "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen".split(" "),
);
const COLOR_PROP = /color|background|border|outline|fill|stroke|shadow|caret|accent|text-decoration|column-rule|^--/i;

/** First raw colour in a string, or null. Named colours count only in CSS values. @param {string} text @param {boolean} [named] */
export function findRawColor(text, named = false) {
  const hex = HEX.exec(text);
  if (hex) return hex[0];
  const fn = FN.exec(text);
  if (fn) return fn[0];
  if (named) {
    for (const [word] of text.matchAll(/(?<![\w-])[a-z]+(?![\w-])/gi)) if (NAMED.has(word.toLowerCase())) return word;
  }
  return null;
}

const message = (/** @type {string} */ found) => `Raw colour "${found}". Use a colour role: var(--pulse-color-<role>).`;

export default {
  meta: { type: "problem", docs: { description: "Colours must come from colour roles" }, schema: [] },
  create(/** @type {any} */ context) {
    /** @param {any} node @param {string} text */
    const check = (node, text) => {
      const found = findRawColor(text);
      if (found) context.report({ node, message: message(found) });
    };
    return {
      Declaration(/** @type {any} */ node) {
        const found = findRawColor(context.sourceCode.getText(node.value), COLOR_PROP.test(node.property));
        if (found) context.report({ node, message: message(found) });
      },
      Literal(/** @type {any} */ node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      TemplateElement(/** @type {any} */ node) {
        check(node, node.value.raw);
      },
    };
  },
};
