// Lesson 6: the icon grid, written down once and checked against every file.
//
// Every icon is a standalone 24 x 24 SVG drawn with a 2-unit stroke, round
// caps and joins, and a 2-unit corner radius on rectangles. Its points stay
// inside a 2-unit padding (the live area, 2 to 22), so every icon carries the
// same breathing room. The same functions run in Node (`pnpm lint`) and in
// the browser (the Icons panel), on the same files.

/** Past this many icons, the design decision says to weigh a library instead. */
export const ICON_BUDGET = 15;

export const ICON_GRID = Object.freeze({
  size: 24,
  keylinePadding: 2,
  strokeWidth: 2,
  cornerRadius: 2,
  /** The exact attributes every icon's root <svg> carries, nothing more. */
  root: Object.freeze({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    width: "24",
    height: "24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  }),
});

const SHAPES = new Set(["path", "circle", "rect", "line", "polyline"]);
// A child that sets its own paint or transform has left the system.
const OVERRIDES = ["fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "opacity", "transform", "style", "class"];
const PATH_COMMANDS = { M: 2, L: 2, H: 1, V: 1, A: 7, C: 6, Z: 0 };

/** @typedef {{ tag: string, attrs: Record<string, string> }} IconShape */
/** @typedef {{ attrs: Record<string, string>, shapes: IconShape[], problems: string[] }} IconReport */

/** @param {string} text @returns {Record<string, string>} */
function readAttrs(text) {
  /** @type {Record<string, string>} */
  const attrs = {};
  for (const [, k, v] of text.matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[k] = v;
  return attrs;
}

/** @param {string} value */
const nums = (value) => (value.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number);

/**
 * The points a shape passes through, or a problem if it can't be read.
 * @param {IconShape} shape
 * @returns {{ points: [number, number][], problem?: string }}
 */
function shapePoints({ tag, attrs }) {
  const n = (/** @type {string} */ k) => Number(attrs[k] ?? 0);
  if (tag === "circle") return { points: [[n("cx") - n("r"), n("cy") - n("r")], [n("cx") + n("r"), n("cy") + n("r")]] };
  if (tag === "rect") return { points: [[n("x"), n("y")], [n("x") + n("width"), n("y") + n("height")]] };
  if (tag === "line") return { points: [[n("x1"), n("y1")], [n("x2"), n("y2")]] };
  if (tag === "polyline") {
    const v = nums(attrs.points ?? "");
    return { points: Array.from({ length: v.length / 2 }, (_, i) => [v[2 * i], v[2 * i + 1]]) };
  }
  // path: absolute commands only, so every point can be read off the source.
  /** @type {[number, number][]} */
  const points = [];
  let [x, y] = [0, 0];
  for (const [, cmd, args] of (attrs.d ?? "").matchAll(/([a-zA-Z])([^a-zA-Z]*)/g)) {
    if (!(cmd in PATH_COMMANDS)) return { points, problem: `path uses "${cmd}"; draw with absolute M L H V A C Z so every point is readable` };
    const v = nums(args);
    const size = PATH_COMMANDS[/** @type {keyof typeof PATH_COMMANDS} */ (cmd)];
    for (let i = 0; size && i < v.length; i += size) {
      const a = v.slice(i, i + size);
      if (cmd === "H") x = a[0];
      else if (cmd === "V") y = a[0];
      else if (cmd === "A") [x, y] = [a[5], a[6]];
      else if (cmd === "C") {
        points.push([a[0], a[1]], [a[2], a[3]]);
        [x, y] = [a[4], a[5]];
      } else [x, y] = [a[0], a[1]];
      points.push([x, y]);
    }
  }
  return { points };
}

/**
 * Read one icon file and check it against the grid.
 * @param {string} source the .svg file's text
 * @returns {IconReport}
 */
export function checkIcon(source) {
  /** @type {string[]} */
  const problems = [];
  const m = /^\s*<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/.exec(source);
  if (!m) return { attrs: {}, shapes: [], problems: ["not a single <svg> element"] };
  const attrs = readAttrs(m[1]);
  for (const [k, want] of Object.entries(ICON_GRID.root)) {
    if (attrs[k] !== want) problems.push(attrs[k] === undefined ? `${k} is missing; the grid says "${want}"` : `${k} is "${attrs[k]}"; the grid says "${want}"`);
  }
  for (const k of Object.keys(attrs)) if (!(k in ICON_GRID.root)) problems.push(`root has an extra ${k} attribute`);

  /** @type {IconShape[]} */
  const shapes = [];
  const leftover = m[2].replace(/<(\w+)\b([^>]*?)\/>/g, (_all, tag, rest) => {
    shapes.push({ tag, attrs: readAttrs(rest) });
    return "";
  });
  if (leftover.trim()) problems.push("contains markup other than self-closing shapes");
  const [lo, hi] = [ICON_GRID.keylinePadding, ICON_GRID.size - ICON_GRID.keylinePadding];
  for (const s of shapes) {
    if (!SHAPES.has(s.tag)) problems.push(`<${s.tag}> is not one of ${[...SHAPES].join(", ")}`);
    for (const k of OVERRIDES) if (k in s.attrs) problems.push(`<${s.tag}> sets its own ${k}="${s.attrs[k]}"`);
    if (s.tag === "rect" && (s.attrs.rx !== String(ICON_GRID.cornerRadius) || (s.attrs.ry ?? s.attrs.rx) !== s.attrs.rx)) {
      problems.push(`<rect> corner radius is ${s.attrs.rx ?? "0"}; the grid says ${ICON_GRID.cornerRadius}`);
    }
    const { points, problem } = shapePoints(s);
    if (problem) problems.push(problem);
    const out = points.find(([px, py]) => px < lo || px > hi || py < lo || py > hi);
    if (out) problems.push(`<${s.tag}> reaches ${out[0]},${out[1]}, outside the ${lo}-${hi} live area`);
  }
  return { attrs, shapes, problems };
}

/** The markup of a shape, rebuilt from what was read. @param {IconShape} s */
export const shapeMarkup = (s) => `<${s.tag} ${Object.entries(s.attrs).map(([k, v]) => `${k}="${v}"`).join(" ")}/>`;
