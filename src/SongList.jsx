import React from "react";

export default function SongList({ songs, folder, selectSong, deleteSong }) {
  if (!songs || songs.length === 0) {
    return <p className="text-xs text-gray-500">No songs in this folder yet</p>;
  }

  return (
    <ul className="divide-y divide-gray-100">
      {songs.map((song, index) => (
        <li key={index} className="flex items-center justify-between py-2 sm:py-3">
          <button
            onClick={() => selectSong(index)}
            className="flex-1 text-left text-sm sm:text-base text-gray-800 hover:text-gray-900 pr-2"
          >
            <span className="block sm:inline">{song.title}</span>
            <span className="text-gray-400 text-xs sm:text-sm"> ({song.key || "C"})</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete song "${song.title}"?`)) {
                deleteSong(folder, index);
              }
            }}
            className="ml-2 text-gray-400 hover:text-red-600 text-lg sm:text-base flex-shrink-0"
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
