import React, { useState } from 'react';

// Chromatic scale using sharps; flats normalized to equivalent sharps
const NOTE_SEQUENCE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_TO_SHARP = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#" };

function normalizeNote(note) {
  if (!note) return note;
  if (FLAT_TO_SHARP[note]) return FLAT_TO_SHARP[note];
  return note;
}

function splitRootSuffix(token) {
  // Root: A-G possibly with # or b; rest is suffix (m, maj7, sus4, etc.)
  const match = token.match(/^([A-G](?:#|b)?)(.*)$/);
  if (!match) return { root: token, suffix: "" };
  return { root: match[1], suffix: match[2] };
}

function transposeNote(root, steps) {
  const norm = normalizeNote(root);
  const idx = NOTE_SEQUENCE.indexOf(norm);
  if (idx === -1) return root; // if unknown, keep as-is
  const newIdx = (idx + steps + NOTE_SEQUENCE.length) % NOTE_SEQUENCE.length;
  return NOTE_SEQUENCE[newIdx];
}

function transposeChordToken(chordToken, steps) {
  // Handle slash chords like G/B
  const [main, bass] = chordToken.split('/')
    .map((s) => s.trim());
  const { root, suffix } = splitRootSuffix(main);
  const transposedMain = transposeNote(root, steps) + suffix;
  if (!bass) return transposedMain;
  const transposedBass = transposeNote(bass, steps);
  return `${transposedMain}/${transposedBass}`;
}

function transposeSequence(inner, steps) {
  // Preserve spaces between multiple chords inside one bracket, e.g. "Gsus G"
  const parts = inner.split(/(\s+)/);
  return parts.map((p) => {
    if (/^\s+$/.test(p) || p === '') return p; // keep spaces as-is
    return transposeChordToken(p, steps);
  }).join('');
}

function highlightAndTranspose(text, steps) {
  // Tokenize with support for escaped double brackets [[...]] → renders as literal [ ... ]
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === '[') {
      // Escaped literal [[...]]
      if (text[i + 1] === '[') {
        const end = text.indexOf(']]', i + 2);
        if (end !== -1) {
          const literalContent = text.slice(i + 2, end);
          // Treat as chord but render with one visible bracket pair
          chunks.push({ type: 'escapedChord', content: literalContent });
          i = end + 2;
          continue;
        }
      }
      // Single bracket chord [...]
      const end = text.indexOf(']', i + 1);
      if (end !== -1) {
        const chordInner = text.slice(i + 1, end);
        chunks.push({ type: 'chord', content: chordInner });
        i = end + 1;
        continue;
      }
    }
    // Plain text until next '[' or end
    const next = text.indexOf('[', i + 1);
    const sliceEnd = next === -1 ? text.length : next;
    chunks.push({ type: 'text', content: text.slice(i, sliceEnd) });
    i = sliceEnd;
  }

  return chunks.map((chunk, idx) => {
    if (chunk.type === 'chord') {
      const transposedSeq = transposeSequence(chunk.content, steps);
      return (
        <span key={idx} className="text-accent-600 font-semibold">
          <span className="invisible">[</span>
          {transposedSeq}
          <span className="invisible">]</span>
        </span>
      );
    }
    if (chunk.type === 'escapedChord') {
      const transposedSeq = transposeSequence(chunk.content, steps);
      return (
        <span key={idx} className="text-accent-600 font-semibold">[{transposedSeq}]</span>
      );
    }
    return (
      <span key={idx} className="text-gray-900">{chunk.content}</span>
    );
  });
}

const SongDisplay = ({ song, multiColumn = false, steps = 0, zoomLevel = 1 }) => {
  const [localSteps, setLocalSteps] = useState(0);
  const currentSteps = multiColumn ? steps : localSteps;
  const setCurrentSteps = multiColumn ? () => {} : setLocalSteps;
  const text = (song.lyrics || song.chords || "");

  return (
    <div className="relative">
      {!multiColumn && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex gap-2">
          <button aria-label="Transpose up" title="Transpose up" onClick={() => setCurrentSteps((s) => s + 1)} className="btn-primary flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m18 15-6-6-6 6"/>
            </svg>
          </button>
          <button aria-label="Transpose down" title="Transpose down" onClick={() => setCurrentSteps((s) => s - 1)} className="btn-primary flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          </div>
        </div>
      )}
    <div className="p-5">
      {multiColumn ? (() => {
        const lines = text.split('\n');
        const blocks = [];
        let current = [];
        for (const line of lines) {
          if (line.trim() === "") {
            if (current.length) {
              blocks.push(current.join('\n'));
              current = [];
            }
          } else {
            current.push(line);
          }
        }
        if (current.length) blocks.push(current.join('\n'));

        const lengths = blocks.map(b => b.length);
        const total = lengths.reduce((a,b)=>a+b,0) || 1;
        const half = total/2;
        let acc = 0; let split = 0;
        for (let i=0;i<lengths.length;i++){ acc += lengths[i]; if (acc>=half){ split=i+1; break; } }
        // Ensure second column starts with a chord-leading block if possible
        const isChordLeading = (block) => {
          const firstLine = block.split('\n').find(l => l.trim() !== "") || "";
          const firstNonSpace = firstLine.trimStart()[0];
          return firstNonSpace === '['; // starts with bracket chord
        };
        let adjusted = split;
        for (let i = split; i < blocks.length; i++) {
          if (isChordLeading(blocks[i])) { adjusted = i; break; }
        }
        if (adjusted !== split && adjusted > 0) split = adjusted; // shift to chord-leading block if found

        const left = blocks.slice(0, split);
        const right = blocks.slice(split);

        // Calculate dynamic font size based on zoom level
        const getFontSize = () => {
          const baseSize = 24; // 2xl = 24px
          const newSize = Math.round(baseSize * zoomLevel);
          return `${newSize}px`;
        };

        return (
          <div className="flex gap-10 text-gray-900 font-mono">
            <div 
              className="flex-1 leading-8 whitespace-pre-wrap"
              style={{ fontSize: getFontSize() }}
            >
              {left.map((block, bi) => (
                <div key={bi} className="mb-4">
                  {block.split('\n').map((line, li) => (
                    <div key={li}>{highlightAndTranspose(line, currentSteps)}</div>
                  ))}
                </div>
              ))}
            </div>
            <div 
              className="flex-1 leading-8 whitespace-pre-wrap"
              style={{ fontSize: getFontSize() }}
            >
              {right.map((block, bi) => (
                <div key={bi} className="mb-4">
                  {block.split('\n').map((line, li) => (
                    <div key={li}>{highlightAndTranspose(line, currentSteps)}</div>
                  ))}
                </div>
              ))}
            </div>
      </div>
        );
      })() : (
        <pre 
          className="whitespace-pre-wrap leading-relaxed text-gray-900 font-mono"
          style={{ fontSize: `${Math.round(16 * zoomLevel)}px` }}
        >
          {highlightAndTranspose(text, currentSteps)}
      </pre>
      )}
      </div>
    </div>
  );
};

export default SongDisplay;
