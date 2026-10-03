// Carried forward from Lesson 1: a tiny typed-by-convention fetch wrapper.
/** @param {string} path @param {typeof fetch} [fetchImpl] */
export async function getJson(path, fetchImpl = fetch) {
  const res = await fetchImpl(path);
  if (!res.ok) throw new Error(`${path} responded ${res.status}`);
  return res.json();
}
