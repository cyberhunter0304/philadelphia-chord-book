import React from 'react';

const Navbar = ({ onBack, showBack }) => (
  <nav className="bg-indigo-700 text-white px-5 py-3 flex justify-between items-center shadow">
    {showBack ? (
      <button onClick={onBack} className="text-white hover:underline">&larr; Back</button>
    ) : (
      <h1 className="text-lg font-bold tracking-wide">🎵 Church Chords Book</h1>
    )}
  </nav>
);

export default Navbar;
