import React from "react";

export default function SongList({ songs, folder, selectSong, deleteSong }) {
  if (!songs || songs.length === 0) {
    return <p className="text-xs text-gray-500">No songs in this folder yet</p>;
  }

  return (
    <ul className="divide-y divide-gray-100">
      {songs.map((song, index) => (
        <li key={index} className="flex items-center justify-between py-2">
          <button
            onClick={() => selectSong(index)}
            className="flex-1 text-left text-sm text-gray-800 hover:text-gray-900"
          >
            {song.title} <span className="text-gray-400">({song.key || "C"})</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete song "${song.title}"?`)) {
                deleteSong(folder, index);
              }
            }}
            className="ml-3 text-gray-400 hover:text-red-600"
            aria-label={`Delete ${song.title}`}
            title="Delete song"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
