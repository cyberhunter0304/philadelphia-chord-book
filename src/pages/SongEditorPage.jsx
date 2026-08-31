import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Wand2 } from "lucide-react";
import { useSong } from "@/hooks/useSong";
import { useFolders, useSongs } from "@/hooks/useCollection";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { ChordText } from "@/components/ChordText";
import { AiGenerateChordsDialog } from "@/components/AiGenerateChordsDialog";

const EMPTY = { title: "", folder: "", lyrics: "", key: "", style: "", tempo: "", tags: [] };

export function SongEditorPage({ isNew = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { song, loading } = useSong(isNew ? null : id);
  const { folders } = useFolders();
  const { songs } = useSongs();

  const [form, setForm] = useState(EMPTY);
  const [aiModel, setAiModel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (song) setForm({ ...EMPTY, ...song, tags: song.tags || [] });
  }, [song]);

  const folderOptions = useMemo(() => {
    const set = new Set(folders.map((f) => f.name));
    songs.forEach((s) => s.folder && set.add(s.folder));
    return [...set].sort();
  }, [folders, songs]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.title.trim() || !form.folder.trim()) {
      setError("Title and folder are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        folder: form.folder.trim(),
        lyrics: form.lyrics,
        key: form.key,
        style: form.style,
        tempo: form.tempo,
        tags: (Array.isArray(form.tags) ? form.tags : String(form.tags).split(","))
          .map((t) => t.trim())
          .filter(Boolean),
        ...(aiModel ? { ai_model: aiModel } : {}),
      };
      const saved = isNew ? await api.createSong(payload) : await api.updateSong(id, payload);
      navigate(`/songs/${saved.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const cleanup = async () => {
    if (!form.lyrics.trim()) return;
    setCleaning(true);
    try {
      const res = await api.aiCleanup({ lyrics: form.lyrics });
      setForm((f) => ({ ...f, lyrics: res.lyrics }));
    } catch (e) {
      setError(e.message);
    } finally {
      setCleaning(false);
    }
  };

  if (!isNew && loading) {
    return (
      <div className="flex justify-center p-10">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{isNew ? "New song" : `Edit — ${song?.title}`}</h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Spinner /> : "Save"}
          </Button>
        </div>
      </div>

      {error && <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Label>Title *</Label>
          <Input value={form.title} onChange={set("title")} />
        </div>
        <div>
          <Label>Folder *</Label>
          <Input value={form.folder} onChange={set("folder")} list="folder-options" />
          <datalist id="folder-options">
            {folderOptions.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>
        <div>
          <Label>Key</Label>
          <Input value={form.key} onChange={set("key")} placeholder="G" />
        </div>
        <div>
          <Label>Style</Label>
          <Input value={form.style} onChange={set("style")} />
        </div>
        <div>
          <Label>Tempo (bpm)</Label>
          <Input value={form.tempo} onChange={set("tempo")} />
        </div>
        <div className="sm:col-span-2">
          <Label>Tags (comma separated)</Label>
          <Input
            value={Array.isArray(form.tags) ? form.tags.join(", ") : form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder="communion, easter, upbeat"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <AiGenerateChordsDialog
          defaults={form}
          onAccept={({ lyrics, key, model }) => {
            setForm((f) => ({ ...f, lyrics, key: key || f.key }));
            setAiModel(model);
          }}
        />
        <Button variant="ghost" className="gap-2" onClick={cleanup} disabled={cleaning || !form.lyrics.trim()}>
          {cleaning ? <Spinner /> : <Wand2 className="h-4 w-4" />} Clean up formatting
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <Label>Chart — chords in [brackets], [[G]] shows a literal [G]</Label>
          <textarea
            value={form.lyrics}
            onChange={set("lyrics")}
            rows={24}
            spellCheck={false}
            className="w-full whitespace-pre rounded-lg border bg-surface p-3 font-mono text-sm leading-6"
          />
        </div>
        <div>
          <Label>Live preview</Label>
          <div className="h-full min-h-[24rem] overflow-auto rounded-lg border bg-surface-muted p-3">
            <ChordText text={form.lyrics} className="text-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
