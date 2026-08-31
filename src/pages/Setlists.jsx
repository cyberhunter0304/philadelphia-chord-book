import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListMusic, Plus } from "lucide-react";
import { useSetlists } from "@/hooks/useSetlists";
import { api } from "@/lib/api";
import { AiSetlistDialog } from "@/components/AiSetlistDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, EmptyState, Spinner } from "@/components/ui/misc";

export function Setlists() {
  const { setlists, loading, refresh } = useSetlists();
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const create = async () => {
    if (!name.trim()) return;
    const sl = await api.createSetlist({ name: name.trim(), shared: false, items: [] });
    setName("");
    navigate(`/setlists/${sl.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Setlists</h1>
        <div className="flex gap-2">
          <AiSetlistDialog onCreated={(sl) => navigate(`/setlists/${sl.id}`)} />
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="New setlist name"
          className="max-w-xs"
        />
        <Button onClick={create} className="gap-2">
          <Plus className="h-4 w-4" /> Create
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <Spinner className="h-6 w-6" />
        </div>
      ) : setlists.length === 0 ? (
        <EmptyState icon={ListMusic} title="No setlists yet">
          Create one above or let AI draft it from a theme.
        </EmptyState>
      ) : (
        <ul className="divide-y rounded-xl border">
          {setlists.map((sl) => (
            <li key={sl.id}>
              <button
                onClick={() => navigate(`/setlists/${sl.id}`)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-muted"
              >
                <ListMusic className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 font-medium">{sl.name}</span>
                {sl.shared && <Badge variant="primary">shared</Badge>}
                <Badge>{sl.items?.length || 0} songs</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
