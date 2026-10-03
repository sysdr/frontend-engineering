// Carried forward from Lesson 1. Gains a UI in Lesson 14.
/** @param {number[]} values */
export function summarize(values) {
  const total = values.reduce((a, b) => a + b, 0);
  return { count: values.length, total, mean: values.length ? total / values.length : 0 };
}
