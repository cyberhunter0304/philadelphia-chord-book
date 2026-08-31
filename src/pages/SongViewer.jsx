import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Play, Trash2 } from "lucide-react";
import { useSong } from "@/hooks/useSong";
import { useAuth } from "@/auth/AuthProvider";
import { api } from "@/lib/api";
import { ChordText } from "@/components/ChordText";
import { TransposeControls } from "@/components/TransposeControls";
import { AiAssistantDialog } from "@/components/AiAssistantDialog";
import { Attachments } from "@/components/Attachments";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, Spinner } from "@/components/ui/misc";
import { displaySteps } from "@/lib/chords";
import { Music } from "lucide-react";

export function SongViewer() {
  const { id } = useParams();
  const { song, loading } = useSong(id);
  const { isEditor, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [t, setT] = useState({ transpose: 0, zoom: 1 });

  const steps = useMemo(() => displaySteps(t), [t]);

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (!song) {
    return <EmptyState icon={Music} title="Song not found">It may have been deleted.</EmptyState>;
  }

  const hasChart = (song.lyrics || "").trim().length > 0;

  const remove = async () => {
    if (!window.confirm(`Delete "${song.title}"?`)) return;
    await api.deleteSong(song.id);
    navigate("/");
  };

  const applyChart = (lyrics) =>
    api.updateSong(song.id, { lyrics });

  return (
    <div className="space-y-4">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Library
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{song.title}</h1>
          <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
            {song.folder && <Badge variant="outline">{song.folder}</Badge>}
            {song.key && <span>Key {song.key}</span>}
            {song.style && <span>· {song.style}</span>}
            {song.tempo && <span>· {song.tempo} bpm</span>}
          </div>
          {song.tags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {song.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {hasChart && (
            <Button variant="secondary" className="gap-2" onClick={() => navigate(`/present/song/${song.id}`)}>
              <Play className="h-4 w-4" /> Present
            </Button>
          )}
          {isEditor && hasChart && <AiAssistantDialog song={song} onApply={applyChart} />}
          {isEditor && (
            <Button variant="secondary" className="gap-2" onClick={() => navigate(`/songs/${song.id}/edit`)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
          {isAdmin && (
            <Button variant="ghost" size="icon" onClick={remove} aria-label="Delete song">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {hasChart ? (
        <>
          <TransposeControls
            songKey={song.key}
            transpose={t.transpose}
            zoom={t.zoom}
            onChange={setT}
          />
          <div className="card overflow-x-auto p-5">
            <ChordText text={song.lyrics} steps={steps} style={{ fontSize: `${16 * t.zoom}px` }} />
          </div>
        </>
      ) : (
        <EmptyState icon={Music} title="No chord chart yet">
          {isEditor
            ? "Open the editor and use “Generate with AI”, or type the chart by hand."
            : "Nobody has added chords for this song yet."}
          {isEditor && (
            <span className="mt-3 block">
              <Button size="sm" onClick={() => navigate(`/songs/${song.id}/edit`)}>
                Open editor
              </Button>
            </span>
          )}
        </EmptyState>
      )}

      <Attachments songId={song.id} />
    </div>
  );
}
