import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

/** Live subscription to a Firestore collection, returned as an array with ids. */
export function useCollection(name, ...constraints) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const key = JSON.stringify(constraints.map((c) => c?._key || ""));

  useEffect(() => {
    const q = query(collection(db, name), ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, key]);

  return { docs, loading, error };
}

export function useSongs() {
  const { docs, loading, error } = useCollection("songs");
  const songs = useMemo(
    () => [...docs].sort((a, b) => (a.title || "").localeCompare(b.title || "")),
    [docs]
  );
  return { songs, loading, error };
}

export function useFolders() {
  const { docs, loading } = useCollection("folders");
  const folders = useMemo(
    () => [...docs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.name || "").localeCompare(b.name || "")),
    [docs]
  );
  return { folders, loading };
}
