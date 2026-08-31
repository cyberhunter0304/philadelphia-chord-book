import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FolderPlus, Music, Plus, Sparkles, Trash2 } from "lucide-react";
import { useFolders, useSongs } from "@/hooks/useCollection";
import { useAuth } from "@/auth/AuthProvider";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, EmptyState, Spinner } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export function Library() {
  const { songs, loading } = useSongs();
  const { folders } = useFolders();
  const { isEditor, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeFolder, setActiveFolder] = useState(null);
  const [needsOnly, setNeedsOnly] = useState(false);
  const [newFolder, setNewFolder] = useState("");
  const [busy, setBusy] = useState(false);

  const folderNames = useMemo(() => {
    const set = new Set(folders.map((f) => f.name));
    songs.forEach((s) => s.folder && set.add(s.folder));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [folders, songs]);

  const counts = useMemo(() => {
    const c = {};
    songs.forEach((s) => (c[s.folder] = (c[s.folder] || 0) + 1));
    return c;
  }, [songs]);

  const visible = useMemo(() => {
    return songs.filter(
      (s) =>
        (!activeFolder || s.folder === activeFolder) &&
        (!needsOnly || s.needs_chords || !(s.lyrics || "").trim())
    );
  }, [songs, activeFolder, needsOnly]);

  const addFolder = async () => {
    if (!newFolder.trim()) return;
    setBusy(true);
    try {
      await api.createFolder(newFolder.trim());
      setNewFolder("");
    } finally {
      setBusy(false);
    }
  };

  const removeFolder = async (name) => {
    const f = folders.find((x) => x.name === name);
    if (!f) return;
    const cascade = window.confirm(
      `Delete folder "${name}"?\n\nOK = also delete its ${counts[name] || 0} songs.\nCancel = keep the folder.`
    );
    if (!cascade) return;
    await api.deleteFolder(f.id, true);
    if (activeFolder === name) setActiveFolder(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
      <aside className="space-y-4">
        <div className="card p-3">
          <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Folders
          </p>
          <button
            onClick={() => setActiveFolder(null)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm",
              !activeFolder ? "bg-surface-muted font-medium" : "hover:bg-surface-muted"
            )}
          >
            All songs <Badge>{songs.length}</Badge>
          </button>
          {folderNames.map((name) => (
            <div key={name} className="group flex items-center">
              <button
                onClick={() => setActiveFolder(name)}
                className={cn(
                  "flex flex-1 items-center justify-between rounded-md px-2 py-1.5 text-sm",
                  activeFolder === name ? "bg-surface-muted font-medium" : "hover:bg-surface-muted"
                )}
              >
                {name} <Badge>{counts[name] || 0}</Badge>
              </button>
              {isAdmin && (
                <button
                  onClick={() => removeFolder(name)}
                  className="ml-1 hidden p-1 text-muted-foreground hover:text-red-500 group-hover:block"
                  aria-label={`Delete ${name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}

          {isEditor && (
            <div className="mt-2 flex gap-1">
              <Input
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFolder()}
                placeholder="New folder"
                className="h-8 text-xs"
              />
              <Button size="icon" variant="secondary" className="h-8 w-8" onClick={addFolder} disabled={busy}>
                <FolderPlus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
          <input type="checkbox" checked={needsOnly} onChange={(e) => setNeedsOnly(e.target.checked)} />
          Needs chord chart
        </label>
      </aside>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">{activeFolder || "All songs"}</h1>
          {isEditor && (
            <Button onClick={() => navigate("/songs/new")} className="gap-2">
              <Plus className="h-4 w-4" /> New song
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center p-10">
            <Spinner className="h-6 w-6" />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState icon={Music} title="No songs here yet">
            {isEditor ? "Create one, or use AI to generate a chord chart." : "Check back later."}
          </EmptyState>
        ) : (
          <ul className="divide-y rounded-xl border">
            {visible.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/songs/${s.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.folder}
                      {s.style ? ` · ${s.style}` : ""}
                    </p>
                  </div>
                  {s.key && <Badge variant="outline">{s.key}</Badge>}
                  {s.ai_generated && (
                    <Sparkles className="h-3.5 w-3.5 text-accent" title="AI-assisted" />
                  )}
                  {(s.needs_chords || !(s.lyrics || "").trim()) && (
                    <Badge variant="accent">needs chart</Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
