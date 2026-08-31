import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Search as SearchIcon } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { useSongs } from "@/hooks/useCollection";
import { useAuth } from "@/auth/AuthProvider";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function CommandPalette({ open, onOpenChange }) {
  const [q, setQ] = useState("");
  const [aiHits, setAiHits] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { songs } = useSongs();
  const { isEditor } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setQ("");
      setAiHits(null);
    }
  }, [open]);

  const local = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return songs.slice(0, 8);
    return songs
      .filter(
        (s) =>
          s.title?.toLowerCase().includes(needle) ||
          s.folder?.toLowerCase().includes(needle) ||
          (s.tags || []).some((t) => t.toLowerCase().includes(needle))
      )
      .slice(0, 12);
  }, [q, songs]);

  const go = (id) => {
    onOpenChange(false);
    navigate(`/songs/${id}`);
  };

  const runAi = async () => {
    if (!q.trim()) return;
    setAiLoading(true);
    setAiHits(null);
    try {
      const res = await api.aiSearch({ query: q.trim(), limit: 15 });
      setAiHits(res.hits);
    } catch (e) {
      setAiHits([{ error: e.message }]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] max-w-xl translate-y-0 p-0">
        <div className="flex items-center gap-2 border-b px-3">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isEditor) runAi();
              if (e.key === "Enter" && !isEditor && local[0]) go(local[0].id);
            }}
            placeholder={isEditor ? "Search titles… (Enter for AI theme search)" : "Search titles…"}
            className="h-12 border-0 focus-visible:ring-0"
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {isEditor && q.trim() && (
            <button
              onClick={runAi}
              className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-primary hover:bg-surface-muted"
            >
              <Sparkles className="h-4 w-4" />
              AI search for “{q.trim()}”
              {aiLoading && <Spinner className="ml-auto" />}
            </button>
          )}

          {aiHits?.length > 0 && !aiHits[0].error && (
            <div className="mb-2">
              <p className="px-2 py-1 text-xs text-muted-foreground">AI matches</p>
              {aiHits.map((h) => (
                <button
                  key={h.song_id}
                  onClick={() => go(h.song_id)}
                  className="flex w-full flex-col rounded-md px-2 py-1.5 text-left hover:bg-surface-muted"
                >
                  <span className="text-sm font-medium">{h.title}</span>
                  <span className="text-xs text-muted-foreground">{h.reason}</span>
                </button>
              ))}
            </div>
          )}
          {aiHits?.[0]?.error && (
            <p className="px-2 py-1 text-xs text-red-500">{aiHits[0].error}</p>
          )}

          <p className="px-2 py-1 text-xs text-muted-foreground">Songs</p>
          {local.length === 0 && <p className="px-2 py-2 text-sm text-muted-foreground">No matches</p>}
          {local.map((s) => (
            <button
              key={s.id}
              onClick={() => go(s.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface-muted"
              )}
            >
              <span className="font-medium">{s.title}</span>
              <span className="text-xs text-muted-foreground">
                {s.key} · {s.folder}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
