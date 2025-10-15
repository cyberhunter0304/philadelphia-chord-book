import React, { useState } from "react";

export default function FolderList({ folders, onSelectFolder, onAddFolder, onDeleteFolder, selectedFolder }) {
  const [newFolder, setNewFolder] = useState("");

  const handleAdd = () => {
    if (newFolder.trim() !== "") {
      onAddFolder(newFolder.trim());  // triggers App.jsx addFolder
      setNewFolder("");
    }
  };

  return (
    <aside className="w-64 shrink-0">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Folders</h2>
        <ul className="mb-4 space-y-1">
          {Object.keys(folders).length === 0 && (
            <li className="text-xs text-gray-500">No folders yet</li>
          )}
          {Object.keys(folders).map((folder) => (
            <li key={folder} className="group flex items-center justify-between">
              <button
                className={`text-left text-sm w-full py-1 rounded ${selectedFolder === folder ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:text-gray-900 hover:underline'}`}
                onClick={() => onSelectFolder(folder)}
              >
                {folder}
              </button>
              <button
                className="ml-2 text-gray-400 hover:text-red-600 text-sm"
                aria-label={`Delete ${folder}`}
                onClick={() => {
                  if (window.confirm(`Delete folder "${folder}" and all its songs?`)) {
                    onDeleteFolder(folder);
                  }
                }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            placeholder="New folder"
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button onClick={handleAdd} className="px-3 py-1 text-sm bg-gray-900 text-white rounded-lg hover:bg-black">
            Add
          </button>
        </div>
      </div>
    </aside>
  );
}
