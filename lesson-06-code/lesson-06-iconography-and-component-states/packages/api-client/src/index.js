// Carried forward from Lesson 1. A thin fetch wrapper the apps share.
export { formatMoney } from "@pulse/utils";

/** @param {string} path @param {RequestInit} [init] */
export async function getJson(path, init) {
  const res = await fetch(path, init);
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} failed with ${res.status}`);
  return res.json();
}
