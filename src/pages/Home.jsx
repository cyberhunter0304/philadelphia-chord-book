import React, { useState } from 'react';

const Home = ({ songs, onSelect }) => {
  const categories = [...new Set(songs.map(song => song.category))];
  const [selectedCategory, setSelectedCategory] = useState(null);

  return (
    <div className="p-5">
      <h2 className="text-2xl font-bold mb-4">Song Categories</h2>

      <div className="flex flex-wrap gap-3 mb-5">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {selectedCategory && (
        <>
          <h3 className="text-xl font-semibold mb-3">{selectedCategory} Songs</h3>
          <ul className="space-y-2">
            {songs
              .filter(song => song.category === selectedCategory)
              .map(song => (
                <li
                  key={song.title}
                  onClick={() => onSelect(song)}
                  className="cursor-pointer p-3 bg-white rounded-xl shadow hover:bg-indigo-50 border border-gray-100"
                >
                  {song.title}
                </li>
              ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default Home;
