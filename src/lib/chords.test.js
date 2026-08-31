import { describe, expect, it } from "vitest";
import {
  chartBlocks,
  displaySteps,
  tokenizeChart,
  transposeChart,
  transposeChordToken,
  transposeNote,
  transposeSequence,
} from "./chords";

describe("transposeNote", () => {
  it("wraps around the octave", () => {
    expect(transposeNote("A", 3)).toBe("C");
    expect(transposeNote("C", -1)).toBe("B");
  });
  it("normalizes flats to sharps", () => {
    expect(transposeNote("Bb", 0)).toBe("A#");
    expect(transposeNote("Eb", 2)).toBe("F");
  });
  it("leaves unknown tokens alone", () => {
    expect(transposeNote("H", 2)).toBe("H");
  });
});

describe("transposeChordToken", () => {
  it("keeps the suffix", () => {
    expect(transposeChordToken("Gm7", 2)).toBe("Am7");
    expect(transposeChordToken("Csus4", 5)).toBe("Fsus4");
  });
  it("transposes slash chords including the bass note", () => {
    expect(transposeChordToken("G/B", 2)).toBe("A/C#");
    expect(transposeChordToken("D/F#", -2)).toBe("C/E");
  });
});

describe("transposeSequence", () => {
  it("preserves spacing between stacked chords", () => {
    expect(transposeSequence("Gsus G", 2)).toBe("Asus A");
    expect(transposeSequence("Gsus  G", 0)).toBe("Gsus  G");
  });
});

describe("tokenizeChart", () => {
  it("classifies text, chords and escaped chords", () => {
    const chunks = tokenizeChart("[G]Hi [[C]] there");
    expect(chunks.map((c) => c.type)).toEqual(["chord", "text", "escapedChord", "text"]);
    expect(chunks[0].content).toBe("G");
    expect(chunks[2].content).toBe("C");
  });
});

describe("transposeChart", () => {
  it("round-trips a full chart and preserves escapes", () => {
    const src = "[G]Amazing [G/B]grace [[Gsus G]]\n[C] [D] [Em]";
    expect(transposeChart(src, 2)).toBe("[A]Amazing [A/C#]grace [[Asus A]]\n[D] [E] [F#m]");
  });
  it("is identity for 0 steps", () => {
    const src = "[G]test [C]line";
    expect(transposeChart(src, 0)).toBe(src);
  });
});

describe("displaySteps", () => {
  it("returns the transpose amount", () => {
    expect(displaySteps({ transpose: 2 })).toBe(2);
    expect(displaySteps()).toBe(0);
  });
});

describe("chartBlocks", () => {
  it("splits on blank lines", () => {
    expect(chartBlocks("a\nb\n\nc")).toEqual(["a\nb", "c"]);
  });
});
