import React, { useState, useEffect, useRef } from "react";
import FolderList from "./FolderList";
import SongList from "./SongList";
import SongEditor from "./SongEditor";
import SongDisplay from "./components/SongDisplay";

export default function App() {
  const [folders, setFolders] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // null => creating new
  const [editingSong, setEditingSong] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [steps, setSteps] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const previewRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:5174/api/folders");
        const data = await res.json();
        setFolders(data || {});
      } catch (e) {
        // fallback to empty state
        setFolders({});
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const addFolder = async (name) => {
    try {
      const res = await fetch("http://localhost:5174/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const json = await res.json();
      if (json && json.folders) setFolders(json.folders);
    } catch {}
  };

  const deleteFolder = async (name) => {
    try {
      const res = await fetch(`http://localhost:5174/api/folders/${encodeURIComponent(name)}`, { method: "DELETE" });
      const json = await res.json();
      if (json && json.folders) setFolders(json.folders);
      if (selectedFolder === name) setSelectedFolder(null);
    } catch {}
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const enterFullscreen = async () => {
    if (previewRef.current && !document.fullscreenElement) {
      try {
        await previewRef.current.requestFullscreen();
        setIsFullscreen(true);
        
        // Auto-calculate zoom based on content length
        const song = folders[selectedFolder][selectedSong];
        const text = song.lyrics || song.chords || "";
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length || 0;
        
        // Auto-zoom calculation: longer lines = smaller zoom, shorter lines = larger zoom
        let autoZoom = 1;
        if (avgLineLength > 80) autoZoom = 0.8;
        else if (avgLineLength > 60) autoZoom = 0.9;
        else if (avgLineLength < 30) autoZoom = 1.2;
        else if (avgLineLength < 20) autoZoom = 1.4;
        
        setZoomLevel(autoZoom);
      } catch (e) {
        // noop
      }
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (e) {
        // noop
      }
    }
  };

  return (
    <div className="min-h-screen text-gray-900">
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b border-brand-100">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
          {/* Mobile Layout */}
          <div className="flex flex-col sm:hidden gap-2">
            <div className="flex items-center justify-between">
              <h1 className="text-base font-semibold tracking-tight bg-gradient-to-r from-brand-700 to-accent-600 bg-clip-text text-transparent">Philadelphia Chord Book</h1>
            </div>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearching(true);
                }}
                onFocus={() => setIsSearching(true)}
                onBlur={() => setTimeout(() => setIsSearching(false), 150)}
                placeholder="Search songs..."
                className="input text-sm"
              />
              {isSearching && searchQuery.trim() !== "" && (
                <div className="absolute mt-2 w-full bg-white/95 border border-brand-100 rounded-xl shadow-xl max-h-60 overflow-auto z-20 backdrop-blur">
                  {(() => {
                    const q = searchQuery.trim().toLowerCase();
                    const results = Object.entries(folders).flatMap(([folderName, list]) =>
                      (list || []).map((song, index) => ({
                        folderName,
                        index,
                        title: song.title || "Untitled",
                        key: song.key || "C",
                      }))
                    ).filter(({ title }) => title.toLowerCase().includes(q));

                    if (results.length === 0) {
                      return (
                        <div className="px-3 py-2 text-xs text-gray-500">No matches</div>
                      );
                    }

                    return (
                      <ul className="py-1">
                        {results.slice(0, 20).map(({ folderName, index, title, key }) => (
                          <li key={`${folderName}-${index}`}>
                            <button
                              className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setSelectedFolder(folderName);
                                const song = folders[folderName][index];
                                setEditingIndex(index);
                                setEditingSong(song);
                                setIsEditing(true);
                                setSearchQuery("");
                                setIsSearching(false);
                              }}
                            >
                              <span className="font-medium text-gray-800">{title}</span>
                              <span className="ml-2 text-gray-400">({key})</span>
                              <span className="ml-2 text-gray-500 text-xs">in {folderName}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center gap-4">
            <h1 className="text-lg font-semibold tracking-tight mr-auto bg-gradient-to-r from-brand-700 to-accent-600 bg-clip-text text-transparent">Philadelphia Chord Book</h1>
            <div className="relative w-full max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearching(true);
                }}
                onFocus={() => setIsSearching(true)}
                onBlur={() => setTimeout(() => setIsSearching(false), 150)}
                placeholder="Search songs across all folders..."
                className="input"
              />
              {isSearching && searchQuery.trim() !== "" && (
                <div className="absolute mt-2 w-full bg-white/95 border border-brand-100 rounded-xl shadow-xl max-h-80 overflow-auto z-20 backdrop-blur">
                  {(() => {
                    const q = searchQuery.trim().toLowerCase();
                    const results = Object.entries(folders).flatMap(([folderName, list]) =>
                      (list || []).map((song, index) => ({
                        folderName,
                        index,
                        title: song.title || "Untitled",
                        key: song.key || "C",
                      }))
                    ).filter(({ title }) => title.toLowerCase().includes(q));

                    if (results.length === 0) {
                      return (
                        <div className="px-3 py-2 text-xs text-gray-500">No matches</div>
                      );
                    }

                    return (
                      <ul className="py-1">
                        {results.slice(0, 50).map(({ folderName, index, title, key }) => (
                          <li key={`${folderName}-${index}`}>
                            <button
                              className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setSelectedFolder(folderName);
                                const song = folders[folderName][index];
                                setEditingIndex(index);
                                setEditingSong(song);
                                setIsEditing(true);
                                setSearchQuery("");
                                setIsSearching(false);
                              }}
                            >
                              <span className="font-medium text-gray-800">{title}</span>
                              <span className="ml-2 text-gray-400">({key})</span>
                              <span className="ml-2 text-gray-500 text-xs">in {folderName}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
      <FolderList
        folders={folders}
            onSelectFolder={(name) => {
              setSelectedFolder(name);
              setSelectedSong(null);
              setIsEditing(false);
            }}
        onAddFolder={addFolder}
        onDeleteFolder={deleteFolder}
            selectedFolder={selectedFolder}
      />
          <section className="flex-1">
        {selectedFolder ? (
              <div className="card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div></div>
                  {!isEditing && selectedSong === null && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditingIndex(null);
                        setEditingSong({ title: "", lyrics: "", key: "C", style: "Worship", tempo: 120 });
                      }}
                      className="btn-primary flex items-center gap-2"
                      aria-label="New song"
                      title="New song"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <SongEditor
                    song={editingSong}
                    save={async (songData) => {
                      try {
                        if (editingIndex === null) {
                          const res = await fetch(`http://localhost:5174/api/folders/${encodeURIComponent(selectedFolder)}/songs`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(songData)
                          });
                          const json = await res.json();
                          if (json && json.folders) {
                            setFolders(json.folders);
                            const newIndex = (json.folders[selectedFolder] || []).length - 1;
                            setSelectedSong(newIndex >= 0 ? newIndex : null);
                          }
                        } else {
                          const res = await fetch(`http://localhost:5174/api/folders/${encodeURIComponent(selectedFolder)}/songs/${editingIndex}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(songData)
                          });
                          const json = await res.json();
                          if (json && json.folders) {
                            setFolders(json.folders);
                            setSelectedSong(editingIndex);
                          }
                        }
                      } catch {}
                      setIsEditing(false);
                      setEditingIndex(null);
                      setEditingSong(null);
                    }}
                    close={() => {
                      setIsEditing(false);
                      setEditingIndex(null);
                      setEditingSong(null);
                    }}
                  />
                ) : selectedSong !== null ? (
                  <div>
                    {/* Song Info Header */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold">{folders[selectedFolder][selectedSong].title}</h2>
                        <div className="flex items-center gap-2">
                          <button
                            className="btn-primary flex items-center justify-center"
                            onClick={() => {
                              const song = folders[selectedFolder][selectedSong];
                              setEditingIndex(selectedSong);
                              setEditingSong(song);
                              setIsEditing(true);
                            }}
                            aria-label="Edit"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
                          </button>
                          {!isFullscreen ? (
                            <button className="btn-primary flex items-center justify-center" onClick={enterFullscreen} aria-label="Present" title="Present">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h20"/><path d="M2 21h20"/><path d="M7 8h10v8H7z"/></svg>
                            </button>
                          ) : (
                            <button className="btn-primary flex items-center justify-center" onClick={exitFullscreen} aria-label="Close" title="Close">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 6-12 12"/><path d="m6 6 12 12"/></svg>
                            </button>
        )}
      </div>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        {folders[selectedFolder][selectedSong].style && <span><strong>Style:</strong> {folders[selectedFolder][selectedSong].style}</span>}
                        {folders[selectedFolder][selectedSong].key && <span><strong>Key:</strong> {folders[selectedFolder][selectedSong].key}</span>}
                        {folders[selectedFolder][selectedSong].tempo && <span><strong>Tempo:</strong> {folders[selectedFolder][selectedSong].tempo}</span>}
                      </div>
                    </div>
                    
                    {/* Preview Box */}
                    <div
                      ref={previewRef}
                      className={`relative bg-white border border-brand-100 rounded-xl p-4 ${isFullscreen ? 'h-screen overflow-y-auto' : ''}`}
                    >
                      {isFullscreen && (
                        <>
                          {/* Song Info Header in Presentation */}
                          <div className="sticky top-2 z-10 mb-4 bg-white/95 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-gray-200">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1">
                                <h2 className="text-xl sm:text-3xl font-bold">{folders[selectedFolder][selectedSong].title}</h2>
                                <div className="flex items-center gap-2">
                                  <div className="flex gap-1 sm:gap-2">
                                    <button
                                      className="btn-primary flex items-center justify-center p-2 sm:p-3"
                                      onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                                      aria-label="Zoom out"
                                      title="Zoom out"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M8 11h6"/>
                                      </svg>
                                    </button>
                                    <button
                                      className="btn-primary flex items-center justify-center p-2 sm:p-3"
                                      onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                                      aria-label="Zoom in"
                                      title="Zoom in"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/>
                                      </svg>
                                    </button>
                                    <button
                                      className="btn-primary flex items-center justify-center p-2 sm:p-3"
                                      onClick={() => setZoomLevel(1)}
                                      aria-label="Reset zoom"
                                      title="Reset zoom"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                        <path d="M3 3v5h5"/>
                                      </svg>
                                    </button>
                                  </div>
                                  <button
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center justify-center ml-auto sm:ml-0"
                                    onClick={exitFullscreen}
                                    aria-label="Close presentation"
                                    title="Close presentation"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 6-12 12"/><path d="m6 6 12 12"/></svg>
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm sm:text-lg text-gray-600">
                                {folders[selectedFolder][selectedSong].style && <span><strong>Style:</strong> {folders[selectedFolder][selectedSong].style}</span>}
                                {folders[selectedFolder][selectedSong].key && <span><strong>Key:</strong> {folders[selectedFolder][selectedSong].key}</span>}
                                {folders[selectedFolder][selectedSong].tempo && <span><strong>Tempo:</strong> {folders[selectedFolder][selectedSong].tempo}</span>}
                              </div>
                            </div>
                          </div>
                          
                          {/* Transpose Controls */}
                          <div className="sticky top-24 z-10 flex justify-end mb-2">
                            <div className="flex gap-2">
                              <button aria-label="Transpose up" title="Transpose up" onClick={() => setSteps((s) => s + 1)} className="btn-primary flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m18 15-6-6-6 6"/>
                                </svg>
                              </button>
                              <button aria-label="Transpose down" title="Transpose down" onClick={() => setSteps((s) => s - 1)} className="btn-primary flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m6 9 6 6 6-6"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                      <SongDisplay song={folders[selectedFolder][selectedSong]} multiColumn={isFullscreen} steps={steps} zoomLevel={zoomLevel} />
                    </div>
                  </div>
                ) : (
                  <SongList
                    songs={folders[selectedFolder]}
                    folder={selectedFolder}
                    selectSong={(index) => {
                      setSelectedSong(index);
                    }}
                    deleteSong={async (folderName, index) => {
                      try {
                        const res = await fetch(`http://localhost:5174/api/folders/${encodeURIComponent(folderName)}/songs/${index}`, { method: "DELETE" });
                        const json = await res.json();
                        if (json && json.folders) setFolders(json.folders);
                        if (selectedSong === index) setSelectedSong(null);
                      } catch {}
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="text-center text-sm text-gray-600 border border-dashed border-gray-300 rounded-xl p-10 bg-white">
                Select or create a folder to manage songs
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
