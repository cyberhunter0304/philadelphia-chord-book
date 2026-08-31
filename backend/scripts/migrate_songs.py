"""One-off migration: data/songs.json  ->  Firestore (songs/*, folders/*).

Idempotent: document IDs are slug(folder-title), so re-running updates in place.

Usage (against the emulator):
    set FIRESTORE_EMULATOR_HOST=localhost:8081
    set FIREBASE_PROJECT_ID=philadelphia-toolkit-fd760
    python backend/scripts/migrate_songs.py

Against production: authenticate with `gcloud auth application-default login`
(or set GOOGLE_APPLICATION_CREDENTIALS) and run without the emulator var.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.firebase import db  # noqa: E402
from app.services.songs_service import song_id  # noqa: E402

DATA = Path(__file__).resolve().parents[2] / "data" / "songs.json"


def main() -> None:
    raw = json.loads(DATA.read_text(encoding="utf-8"))
    client = db()
    now = datetime.now(timezone.utc).isoformat()

    folders = list(raw.keys())
    fbatch = client.batch()
    for order, name in enumerate(folders):
        from slugify import slugify

        fbatch.set(client.collection("folders").document(slugify(name)[:100]), {"name": name, "order": order})
    fbatch.commit()
    print(f"Wrote {len(folders)} folders")

    total = 0
    batch = client.batch()
    pending = 0
    for folder, songs in raw.items():
        for s in songs or []:
            title = (s.get("title") or "Untitled").strip()
            lyrics = s.get("lyrics") or s.get("chords") or ""
            doc = {
                "title": title,
                "folder": folder,
                "lyrics": lyrics,
                "key": (s.get("key") or "").strip(),
                "style": (s.get("style") or "").strip(),
                "tempo": s.get("tempo") or "",
                "tags": s.get("tags") or [],
                "needs_chords": not lyrics.strip(),
                "ai_generated": False,
                "created_by": "migration",
                "updated_at": now,
            }
            batch.set(client.collection("songs").document(song_id(folder, title)), doc)
            pending += 1
            total += 1
            if pending >= 400:
                batch.commit()
                batch = client.batch()
                pending = 0
    if pending:
        batch.commit()

    print(f"Wrote {total} songs")
    stubs = sum(1 for f in raw.values() for s in (f or []) if not (s.get("lyrics") or "").strip())
    print(f"  of which {stubs} need chord charts (needs_chords=True)")


if __name__ == "__main__":
    main()
