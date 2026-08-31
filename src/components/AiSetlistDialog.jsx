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
import { api } from "@/lib/api";

export function AiSetlistDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ theme: "", occasion: "", duration_min: "", count: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const suggest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(
        await api.aiSetlist({
          theme: form.theme,
          occasion: form.occasion,
          duration_min: form.duration_min ? Number(form.duration_min) : null,
          count: form.count ? Number(form.count) : null,
        })
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    const sl = await api.createSetlist({
      name: form.theme.slice(0, 60) || "AI setlist",
      shared: false,
      items: result.picks.map((p) => ({
        song_id: p.song_id,
        key_override: p.suggested_key || null,
        notes: p.reason || null,
      })),
    });
    setOpen(false);
    setResult(null);
    onCreated?.(sl);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <Sparkles className="h-4 w-4 text-accent" /> AI setlist
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Build a setlist with AI</DialogTitle>
          <DialogDescription>Picks come only from songs that have chord charts.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Theme / scripture / mood *</Label>
            <Input value={form.theme} onChange={set("theme")} placeholder="God's faithfulness, Psalm 103" />
          </div>
          <div>
            <Label>Occasion</Label>
            <Input value={form.occasion} onChange={set("occasion")} placeholder="Sunday morning" />
          </div>
          <div>
            <Label>Songs</Label>
            <Input value={form.count} onChange={set("count")} type="number" placeholder="5" />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {result && (
          <div className="space-y-2">
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {result.picks.map((p) => (
                <li key={p.song_id}>
                  <span className="font-medium">{p.title}</span>
                  {p.suggested_key && <span className="text-muted-foreground"> · {p.suggested_key}</span>}
                  <p className="text-xs text-muted-foreground">{p.reason}</p>
                </li>
              ))}
            </ol>
            {result.flow_notes && (
              <p className="rounded-md bg-surface-muted p-2 text-xs text-muted-foreground">
                {result.flow_notes}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={suggest} disabled={loading || !form.theme.trim()}>
            {loading ? <Spinner /> : result ? "Try again" : "Suggest"}
          </Button>
          {result?.picks?.length > 0 && <Button onClick={create}>Save as setlist</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
