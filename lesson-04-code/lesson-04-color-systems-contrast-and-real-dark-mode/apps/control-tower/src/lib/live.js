// Carried forward from Lesson 2: one EventSource per page, many listeners.
const source = new EventSource("/events");

/** @param {string} event @param {(data: any) => void} fn */
export function onLive(event, fn) {
  source.addEventListener(event, (e) => fn(JSON.parse(/** @type {MessageEvent} */ (e).data)));
}

/** @param {string} path */
export async function getJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} responded ${res.status}`);
  return res.json();
}
