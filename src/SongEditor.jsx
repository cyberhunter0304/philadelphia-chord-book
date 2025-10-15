import React, { useState } from "react";

function renderWithChordStyling(text) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === '[') {
      if (text[i + 1] === '[') {
        const end = text.indexOf(']]', i + 2);
        if (end !== -1) {
          const literalContent = text.slice(i + 2, end);
          chunks.push({ type: 'escapedChord', content: literalContent });
          i = end + 2;
          continue;
        }
      }
      const end = text.indexOf(']', i + 1);
      if (end !== -1) {
        const chordInner = text.slice(i + 1, end);
        chunks.push({ type: 'chord', content: chordInner });
        i = end + 1;
        continue;
      }
    }
    const next = text.indexOf('[', i + 1);
    const sliceEnd = next === -1 ? text.length : next;
    chunks.push({ type: 'text', content: text.slice(i, sliceEnd) });
    i = sliceEnd;
  }

  function renderChordSeq(inner) {
    return inner.split(/(\s+)/).map((p, idx) => (
      /^\s+$/.test(p) || p === '' ? <span key={idx}>{p}</span> : (
        <span key={idx} className="text-accent-600 font-semibold">{p}</span>
      )
    ));
  }

  return chunks.map((chunk, idx) => {
    if (chunk.type === 'chord') {
      // Preserve bracket width by rendering invisible brackets around chord content
      return (
        <span key={idx} className="">
          <span className="invisible">[</span>
          {renderChordSeq(chunk.content)}
          <span className="invisible">]</span>
        </span>
      );
    }
    if (chunk.type === 'escapedChord') {
      // Visible single bracket pair
      return <span key={idx} className="text-accent-600 font-semibold">[{renderChordSeq(chunk.content)}]</span>;
    }
    return <span key={idx} className="text-gray-900">{chunk.content}</span>;
  });
}

export default function SongEditor({ song, save, close }) {
  const [title, setTitle] = useState(song.title);
  const [lyrics, setLyrics] = useState(song.lyrics);
  const [keyScale, setKeyScale] = useState(song.key || "C");
  const [style, setStyle] = useState(song.style || "Worship");
  const [tempo, setTempo] = useState(song.tempo || 120);

  const highlightChords = (text) => renderWithChordStyling(text || "");

  return (
    <div className="card p-5 w-full">
      <h2 className="text-lg font-semibold mb-3">Edit Song</h2>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Song Title"
        className="input mb-3"
      />
      <div className="flex gap-2 mb-3">
        <input
          value={keyScale}
          onChange={(e) => setKeyScale(e.target.value)}
          placeholder="Original Key"
          className="input w-1/4"
        />
        <input
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          placeholder="Style"
          className="input w-1/4"
        />
        <input
          type="number"
          value={tempo}
          onChange={(e) => setTempo(e.target.value)}
          placeholder="Tempo"
          className="input w-1/4"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Edit</label>
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="Lyrics with chords e.g. [G]Hello [C]World; escape with [[G]] to show [G]"
            rows={20}
            className="w-full font-mono text-sm leading-6 input min-h-[420px] resize-vertical whitespace-pre"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Live Preview</label>
          <pre className="bg-white border border-brand-100 rounded-xl p-3 whitespace-pre leading-6 text-sm font-mono overflow-auto min-h-[420px]">
            {highlightChords(lyrics)}
          </pre>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => save({ title, lyrics, key: keyScale, style, tempo })}
          className="btn-primary"
        >
          Save
        </button>
        <button onClick={close} className="btn-primary">
          Close
        </button>
      </div>
    </div>
  );
}
