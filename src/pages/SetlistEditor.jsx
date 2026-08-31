import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowUp, Play, Plus, Trash2 } from "lucide-react";
import { useSongs } from "@/hooks/useCollection";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";

export function SetlistEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { songs } = useSongs();
  const [sl, setSl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [addQuery, setAddQuery] = useState("");

  useEffect(() => {
    api.getSetlist(id).then(setSl).catch(() => setSl(false));
  }, [id]);

  const songMap = useMemo(() => Object.fromEntries(songs.map((s) => [s.id, s])), [songs]);
  const matches = useMemo(() => {
    const q = addQuery.trim().toLowerCase();
    if (!q) return [];
    return songs.filter((s) => s.title?.toLowerCase().includes(q)).slice(0, 6);
  }, [addQuery, songs]);

  if (sl === false) return <p className="p-6 text-muted-foreground">Setlist not found.</p>;
  if (!sl) return <div className="flex justify-center p-10"><Spinner className="h-6 w-6" /></div>;

  const patch = (next) => setSl((cur) => ({ ...cur, ...next }));
  const setItems = (items) => patch({ items });

  const move = (i, d) => {
    const items = [...sl.items];
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
    setItems(items);
  };

  const save = async () => {
    setSaving(true);
    try {
      const saved = await api.updateSetlist(id, {
        name: sl.name,
        shared: sl.shared,
        date: sl.date || null,
        items: sl.items,
      });
      setSl(saved);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this setlist?")) return;
    await api.deleteSetlist(id);
    navigate("/setlists");
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/setlists")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Setlists
      </button>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex-1">
          <Label>Name</Label>
          <Input value={sl.name} onChange={(e) => patch({ name: e.target.value })} className="max-w-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!sl.shared} onChange={(e) => patch({ shared: e.target.checked })} />
          Shared with the team
        </label>
        <div className="flex gap-2">
          {sl.items.length > 0 && (
            <Button variant="secondary" className="gap-2" onClick={() => navigate(`/present/setlist/${id}`)}>
              <Play className="h-4 w-4" /> Present
            </Button>
          )}
          <Button onClick={save} disabled={saving}>{saving ? <Spinner /> : "Save"}</Button>
          <Button variant="ghost" size="icon" onClick={remove}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
        </div>
      </div>

      <ol className="space-y-2">
        {sl.items.map((it, i) => {
          const s = songMap[it.song_id];
          return (
            <li key={`${it.song_id}-${i}`} className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
              <span className="w-5 text-center text-sm text-muted-foreground">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {s?.title || it.song_id}
                <span className="ml-2 text-xs text-muted-foreground">{s?.folder}</span>
              </span>
              <Input
                value={it.key_override || ""}
                onChange={(e) => setItems(sl.items.map((x, j) => (j === i ? { ...x, key_override: e.target.value } : x)))}
                placeholder={s?.key || "key"}
                className="h-8 w-16 text-xs"
              />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setItems(sl.items.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </li>
          );
        })}
        {sl.items.length === 0 && <li className="text-sm text-muted-foreground">No songs yet — add some below.</li>}
      </ol>

      <div className="relative max-w-sm">
        <Input value={addQuery} onChange={(e) => setAddQuery(e.target.value)} placeholder="Add a song…" />
        {matches.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border bg-surface shadow-lg">
            {matches.map((s) => (
              <li key={s.id}>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted"
                  onClick={() => {
                    setItems([...sl.items, { song_id: s.id, key_override: null, notes: null }]);
                    setAddQuery("");
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> {s.title}
                  <span className="ml-auto text-xs text-muted-foreground">{s.key}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
