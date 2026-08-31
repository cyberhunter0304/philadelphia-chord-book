import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { api } from "@/lib/api";
import { ChordText } from "@/components/ChordText";
import { autoZoom, chartBlocks, displaySteps } from "@/lib/chords";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";

function useDeck(mode, id) {
  const [deck, setDeck] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (mode === "song") {
          const snap = await getDoc(doc(db, "songs", id));
          if (!cancelled) setDeck(snap.exists() ? [{ id: snap.id, ...snap.data() }] : []);
          return;
        }
        const sl = await api.getSetlist(id);
        const songs = await Promise.all(
          sl.items.map(async (it) => {
            const s = await getDoc(doc(db, "songs", it.song_id));
            return s.exists() ? { id: s.id, ...s.data(), _item: it } : null;
          })
        );
        if (!cancelled) setDeck({ name: sl.name, songs: songs.filter(Boolean) });
      } catch {
        if (!cancelled) setDeck([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, id]);

  return deck;
}

export function Present({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const deck = useDeck(mode, id);
  const songs = Array.isArray(deck) ? deck : deck?.songs;

  const [idx, setIdx] = useState(0);
  const [transpose, setTranspose] = useState(0);
  const [zoom, setZoom] = useState(1);

  const song = songs?.[idx];
  const item = song?._item;

  useEffect(() => {
    setTranspose(0);
    if (song) setZoom(autoZoom(song.lyrics));
  }, [idx, song]);

  const steps = useMemo(() => displaySteps({ transpose }), [transpose]);

  const move = useCallback(
    (d) => setIdx((i) => Math.min((songs?.length || 1) - 1, Math.max(0, i + d))),
    [songs]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (["ArrowRight", "PageDown", " "].includes(e.key)) move(1);
      else if (["ArrowLeft", "PageUp"].includes(e.key)) move(-1);
      else if (e.key === "ArrowUp") setTranspose((t) => t + 1);
      else if (e.key === "ArrowDown") setTranspose((t) => t - 1);
      else if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(3, z + 0.1));
      else if (e.key === "-") setZoom((z) => Math.max(0.5, z - 0.1));
      else if (e.key === "Escape") navigate(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, navigate]);

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, []);

  if (!deck || !songs) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (!song) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        Nothing to present. <Button variant="link" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  const blocks = chartBlocks(song.lyrics);
  const mid = Math.ceil(blocks.length / 2);
  const twoCol = blocks.length > 4;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/90 px-4 py-2 backdrop-blur">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {song.title}
            <span className="ml-2 font-normal text-muted-foreground">
              {(item?.key_override || song.key) ?? ""} {transpose ? `(${transpose > 0 ? "+" : ""}${transpose})` : ""}
            </span>
          </p>
          {deck.name && (
            <p className="truncate text-xs text-muted-foreground">
              {deck.name} — {idx + 1}/{songs.length}
            </p>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => setTranspose((t) => t - 1)}><Minus className="h-4 w-4" /></Button>
          <span className="w-6 text-center text-xs">{transpose > 0 ? `+${transpose}` : transpose}</span>
          <Button size="icon" variant="ghost" onClick={() => setTranspose((t) => t + 1)}><Plus className="h-4 w-4" /></Button>
          <span className="mx-2 h-4 w-px bg-border" />
          <Button size="icon" variant="ghost" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}><Minus className="h-4 w-4" /></Button>
          <span className="w-10 text-center text-xs">{Math.round(zoom * 100)}%</span>
          <Button size="icon" variant="ghost" onClick={() => setZoom((z) => Math.min(3, z + 0.1))}><Plus className="h-4 w-4" /></Button>
          <span className="mx-2 h-4 w-px bg-border" />
          <Button size="icon" variant="ghost" onClick={() => navigate(-1)}><X className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="px-6 py-6" style={{ fontSize: `${24 * zoom}px` }}>
        {twoCol ? (
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              {blocks.slice(0, mid).map((b, i) => (
                <ChordText key={i} text={b} steps={steps} className="mb-6" />
              ))}
            </div>
            <div>
              {blocks.slice(mid).map((b, i) => (
                <ChordText key={i} text={b} steps={steps} className="mb-6" />
              ))}
            </div>
          </div>
        ) : (
          <ChordText text={song.lyrics} steps={steps} />
        )}
      </div>

      {songs.length > 1 && (
        <>
          <button
            onClick={() => move(-1)}
            disabled={idx === 0}
            className="fixed left-2 top-1/2 -translate-y-1/2 rounded-full border bg-surface/80 p-2 disabled:opacity-30"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => move(1)}
            disabled={idx === songs.length - 1}
            className="fixed right-2 top-1/2 -translate-y-1/2 rounded-full border bg-surface/80 p-2 disabled:opacity-30"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  );
}
