// Carried forward from Lesson 2: one EventSource per page, many listeners.
/** @type {EventSource | null} */
let source = null;

/** @param {string} event @param {(data: any) => void} fn */
export function onLive(event, fn) {
  source ??= new EventSource("/events");
  source.addEventListener(event, (e) => fn(JSON.parse(/** @type {MessageEvent} */ (e).data)));
}
