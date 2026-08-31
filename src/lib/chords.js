/**
 * Chord-chart parsing + transposition. Framework-agnostic and pure.
 *
 * Chart format (see backend/app/gemini.py for the generator contract):
 *   [G]Amazing [C]grace          -> chord before the syllable it lands on
 *   [Gsus G]                      -> multiple chords in one position, space separated
 *   [[G]]                         -> escaped: renders as a literal "[G]"
 *   blank line                    -> section break
 */

export const NOTE_SEQUENCE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_TO_SHARP = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#", Cb: "B", Fb: "E" };

export function normalizeNote(note) {
  if (!note) return note;
  return FLAT_TO_SHARP[note] || note;
}

export function splitRootSuffix(token) {
  const match = token.match(/^([A-G](?:#|b)?)(.*)$/);
  if (!match) return { root: token, suffix: "" };
  return { root: match[1], suffix: match[2] };
}

export function transposeNote(root, steps) {
  const idx = NOTE_SEQUENCE.indexOf(normalizeNote(root));
  if (idx === -1) return root;
  const len = NOTE_SEQUENCE.length;
  return NOTE_SEQUENCE[(((idx + steps) % len) + len) % len];
}

export function transposeChordToken(token, steps) {
  if (!token) return token;
  const [main, bass] = token.split("/").map((s) => s.trim());
  const { root, suffix } = splitRootSuffix(main);
  const transposedMain = transposeNote(root, steps) + suffix;
  if (!bass) return transposedMain;
  return `${transposedMain}/${transposeNote(bass, steps)}`;
}

/** Transpose a bracket's inner string, preserving whitespace between chords. */
export function transposeSequence(inner, steps) {
  if (!steps) return inner;
  return inner
    .split(/(\s+)/)
    .map((p) => (/^\s+$/.test(p) || p === "" ? p : transposeChordToken(p, steps)))
    .join("");
}

/** Break a chart into typed chunks: text | chord | escapedChord. */
export function tokenizeChart(text) {
  const chunks = [];
  let i = 0;
  const src = text || "";
  while (i < src.length) {
    if (src[i] === "[") {
      if (src[i + 1] === "[") {
        const end = src.indexOf("]]", i + 2);
        if (end !== -1) {
          chunks.push({ type: "escapedChord", content: src.slice(i + 2, end) });
          i = end + 2;
          continue;
        }
      }
      const end = src.indexOf("]", i + 1);
      if (end !== -1) {
        chunks.push({ type: "chord", content: src.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    const next = src.indexOf("[", i + 1);
    const sliceEnd = next === -1 ? src.length : next;
    chunks.push({ type: "text", content: src.slice(i, sliceEnd) });
    i = sliceEnd;
  }
  return chunks;
}

/** Re-serialize a chart with every chord transposed by `steps` semitones. */
export function transposeChart(text, steps) {
  if (!steps) return text || "";
  return tokenizeChart(text)
    .map((c) => {
      if (c.type === "chord") return `[${transposeSequence(c.content, steps)}]`;
      if (c.type === "escapedChord") return `[[${transposeSequence(c.content, steps)}]]`;
      return c.content;
    })
    .join("");
}

/** Net semitone shift to display. */
export function displaySteps({ transpose = 0 } = {}) {
  return transpose;
}

/** Rough auto-zoom for presentation mode, from average visible line length. */
export function autoZoom(text) {
  const lines = (text || "").split("\n").filter((l) => l.trim() !== "");
  if (!lines.length) return 1;
  const avg = lines.reduce((s, l) => s + l.replace(/\[[^\]]*\]/g, "").length, 0) / lines.length;
  if (avg > 80) return 0.8;
  if (avg > 60) return 0.9;
  if (avg < 20) return 1.4;
  if (avg < 30) return 1.2;
  return 1;
}

/** Split a chart into blank-line-delimited blocks (verses/choruses). */
export function chartBlocks(text) {
  const blocks = [];
  let current = [];
  for (const line of (text || "").split("\n")) {
    if (line.trim() === "") {
      if (current.length) blocks.push(current.join("\n"));
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current.join("\n"));
  return blocks;
}
