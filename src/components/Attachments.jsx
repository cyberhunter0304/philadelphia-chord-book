import { useEffect, useRef, useState } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { api } from "@/lib/api";
import { useAuth } from "@/auth/AuthProvider";

export function Attachments({ songId }) {
  const { isEditor } = useAuth();
  const [items, setItems] = useState([]);
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const refresh = () => api.listAttachments(songId).then(setItems).catch(() => setItems([]));
  useEffect(() => {
    api
      .health()
      .then((h) => setEnabled(!!h.storage))
      .catch(() => setEnabled(false));
  }, []);
  useEffect(() => {
    if (enabled) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songId, enabled]);

  if (!enabled) return null;

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const { upload_url } = await api.attachmentUploadUrl(songId, {
        filename: file.name,
        content_type: file.type || "application/octet-stream",
      });
      await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  if (!items.length && !isEditor) return null;

  return (
    <div className="card space-y-2 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Attachments</h3>
        {isEditor && (
          <>
            <input
              ref={fileRef}
              type="file"
              hidden
              onChange={(e) => upload(e.target.files?.[0])}
            />
            <Button size="sm" variant="ghost" className="gap-1" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? <Spinner /> : <Upload className="h-4 w-4" />} Add
            </Button>
          </>
        )}
      </div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.object_path} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <a href={it.public_url} target="_blank" rel="noreferrer" className="flex-1 truncate hover:underline">
              {it.name}
            </a>
            {isEditor && (
              <button
                onClick={async () => {
                  await api.deleteAttachment(songId, it.name);
                  refresh();
                }}
                className="text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
        {!items.length && <li className="text-xs text-muted-foreground">None yet.</li>}
      </ul>
    </div>
  );
}
