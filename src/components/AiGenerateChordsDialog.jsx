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
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { ChordText } from "@/components/ChordText";
import { api } from "@/lib/api";

export function AiGenerateChordsDialog({ defaults, onAccept }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: defaults.title || "",
    key: defaults.key || "",
    style: defaults.style || "",
    language_hint: "",
    existing_lyrics: defaults.lyrics || "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await api.aiGenerateChords(form));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const accept = () => {
    onAccept({ lyrics: result.lyrics, key: result.key, model: result.model });
    setOpen(false);
    setResult(null);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <Sparkles className="h-4 w-4 text-accent" /> Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generate a chord chart</DialogTitle>
          <DialogDescription>
            Review and edit the result before saving — AI can get lyrics or chords wrong.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <Label>Title</Label>
            <Input value={form.title} onChange={set("title")} />
          </div>
          <div>
            <Label>Key</Label>
            <Input value={form.key} onChange={set("key")} placeholder="G" />
          </div>
          <div>
            <Label>Style</Label>
            <Input value={form.style} onChange={set("style")} placeholder="Worship ballad" />
          </div>
          <div>
            <Label>Language</Label>
            <Input value={form.language_hint} onChange={set("language_hint")} placeholder="English / Tamil" />
          </div>
          <div className="sm:col-span-3">
            <Label>Existing lyrics (optional — AI adds chords, keeps your words)</Label>
            <textarea
              value={form.existing_lyrics}
              onChange={set("existing_lyrics")}
              rows={4}
              className="w-full rounded-lg border bg-surface px-3 py-2 font-mono text-xs"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {result && (
          <div className="space-y-1">
            <Label>Preview · key {result.key}</Label>
            <div className="max-h-[38vh] overflow-auto rounded-lg border bg-surface-muted p-3">
              {result.lyrics ? (
                <ChordText text={result.lyrics} className="text-xs" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  The model wasn’t confident enough to return lyrics.
                </p>
              )}
            </div>
            {result.notes && <p className="text-xs text-muted-foreground">{result.notes}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={generate} disabled={loading || !form.title.trim()}>
            {loading ? <Spinner /> : result ? "Regenerate" : "Generate"}
          </Button>
          {result?.lyrics && <Button onClick={accept}>Use this chart</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
