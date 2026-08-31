import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { tokenizeChart, transposeSequence } from "@/lib/chords";

function ChordSeq({ inner }) {
  return inner.split(/(\s+)/).map((part, i) =>
    /^\s+$/.test(part) || part === "" ? (
      <Fragment key={i}>{part}</Fragment>
    ) : (
      <span key={i} className="chord">
        {part}
      </span>
    )
  );
}

/**
 * Renders a chord chart. `steps` is the net semitone shift (transpose - capo).
 * Chord brackets are kept width-preserving so lyric alignment doesn't jump.
 */
export function ChordText({ text, steps = 0, className, style }) {
  const chunks = tokenizeChart(text || "");
  return (
    <pre className={cn("chart", className)} style={style}>
      {chunks.map((chunk, i) => {
        if (chunk.type === "chord") {
          return (
            <span key={i}>
              <span className="invisible">[</span>
              <ChordSeq inner={transposeSequence(chunk.content, steps)} />
              <span className="invisible">]</span>
            </span>
          );
        }
        if (chunk.type === "escapedChord") {
          return (
            <span key={i} className="chord">
              [<ChordSeq inner={transposeSequence(chunk.content, steps)} />]
            </span>
          );
        }
        return <Fragment key={i}>{chunk.content}</Fragment>;
      })}
    </pre>
  );
}
