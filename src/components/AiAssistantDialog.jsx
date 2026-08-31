import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { api } from "@/lib/api";

const ACTIONS = [
  { id: "simplify", label: "Simplify chords", chart: true },
  { id: "reharmonize", label: "Reharmonize", chart: true },
  { id: "number-notation", label: "Nashville numbers", chart: true },
  { id: "explain", label: "Explain the progression", chart: false },
];

export function AiAssistantDialog({ song, onApply }) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async (a) => {
    setAction(a);
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      setResult(await api.aiAssistant({ song_id: song.id, action: a.id }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    if (!result?.is_chart) return;
    await onApply(result.result);
    setOpen(false);
    setResult(null);
    setAction(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <Sparkles className="h-4 w-4 text-accent" /> AI tools
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI chord assistant</DialogTitle>
          <DialogDescription>“{song.title}” · key {song.key || "?"}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((a) => (
            <Button
              key={a.id}
              size="sm"
              variant={action?.id === a.id ? "default" : "secondary"}
              onClick={() => run(a)}
              disabled={loading}
            >
              {a.label}
            </Button>
          ))}
        </div>

        <div className="min-h-[8rem] rounded-lg border bg-surface-muted p-3 text-sm">
          {loading && (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Spinner /> Thinking…
            </span>
          )}
          {error && <span className="text-red-500">{error}</span>}
          {result && (
            <pre className="chart max-h-[40vh] overflow-auto whitespace-pre-wrap text-xs">
              {result.result}
            </pre>
          )}
          {result?.notes && <p className="mt-2 text-xs text-muted-foreground">{result.notes}</p>}
          {!loading && !result && !error && (
            <span className="text-muted-foreground">Pick an action above.</span>
          )}
        </div>

        <DialogFooter>
          {result?.model && (
            <span className="mr-auto self-center text-xs text-muted-foreground">{result.model}</span>
          )}
          {result?.is_chart && (
            <Button onClick={apply}>Replace chart</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
