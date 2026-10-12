// Shared, dependency-free slogan helpers.
//
// This module is intentionally free of server-only imports so it can be used
// both by the server-side site generator and by client components (e.g. the
// Express generation workspace preview).

// Splits a single logical slogan into exactly three balanced lines at word
// boundaries, preserving the original word order. Example:
//   "Atlarix is where your development team works."
//   -> ["Atlarix is", "where your", "development team works"]
export function splitSloganIntoThreeLines(value: string): [string, string, string] {
  const cleaned = value
    .replace(/\s+/g, " ")
    .replace(/^["'“”«»\s]+|["'“”«»\s]+$/g, "")
    .replace(/[.,;:]+$/g, "")
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length === 0) return ["", "", ""];
  if (words.length === 1) return [words[0], "", ""];
  if (words.length === 2) return [words[0], words[1], ""];

  // Distribute words across three lines as evenly as possible while keeping
  // the reading order intact. The trailing line absorbs the remainder so the
  // sentence reads naturally, e.g. "Atlarix is where your development team
  // works" -> ["Atlarix is", "where your", "development team works"].
  const base = Math.floor(words.length / 3);
  const remainder = words.length % 3;
  const firstCount = base;
  const secondCount = base + (remainder > 1 ? 1 : 0);

  const first = words.slice(0, firstCount).join(" ");
  const second = words.slice(firstCount, firstCount + secondCount).join(" ");
  const third = words.slice(firstCount + secondCount).join(" ");

  return [first, second, third];
}
