"""Firestore access for songs and folders."""
from __future__ import annotations

from datetime import datetime, timezone

from google.cloud.firestore_v1 import FieldFilter
from slugify import slugify

from app.firebase import db

SONGS = "songs"
FOLDERS = "folders"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def song_id(folder: str, title: str) -> str:
    return slugify(f"{folder}-{title}")[:200] or "song"


def _doc_to_song(doc) -> dict:
    data = doc.to_dict() or {}
    data["id"] = doc.id
    data.setdefault("tags", [])
    data.setdefault("needs_chords", not (data.get("lyrics") or "").strip())
    return data


# --- Songs ---


def list_songs() -> list[dict]:
    return [_doc_to_song(d) for d in db().collection(SONGS).stream()]


def get_song(sid: str) -> dict | None:
    doc = db().collection(SONGS).document(sid).get()
    return _doc_to_song(doc) if doc.exists else None


def create_song(payload: dict, *, created_by: str) -> dict:
    payload = dict(payload)
    ai_model = payload.pop("ai_model", None)
    sid = song_id(payload["folder"], payload["title"])
    ref = db().collection(SONGS).document(sid)
    if ref.get().exists:
        # Disambiguate on collision.
        sid = f"{sid}-{int(datetime.now().timestamp())}"
        ref = db().collection(SONGS).document(sid)
    doc = {
        **payload,
        "tags": payload.get("tags", []),
        "needs_chords": not (payload.get("lyrics") or "").strip(),
        "ai_generated": bool(ai_model),
        "ai_model": ai_model,
        "created_by": created_by,
        "updated_at": _now_iso(),
    }
    ref.set(doc)
    ensure_folder(payload["folder"])
    return {**doc, "id": sid}


def update_song(sid: str, patch: dict, *, ai_generated: bool = False, ai_model: str | None = None) -> dict | None:
    ref = db().collection(SONGS).document(sid)
    if not ref.get().exists:
        return None
    patch = {k: v for k, v in patch.items() if v is not None}
    model_from_patch = patch.pop("ai_model", None)
    if "lyrics" in patch:
        patch["needs_chords"] = not patch["lyrics"].strip()
    if ai_generated or model_from_patch:
        patch["ai_generated"] = True
        patch["ai_model"] = ai_model or model_from_patch
    patch["updated_at"] = _now_iso()
    ref.update(patch)
    if patch.get("folder"):
        ensure_folder(patch["folder"])
    return get_song(sid)


def delete_song(sid: str) -> bool:
    ref = db().collection(SONGS).document(sid)
    if not ref.get().exists:
        return False
    ref.delete()
    return True


def search_candidates(query: str, cap: int = 40) -> list[dict]:
    """Cheap keyword prefilter over titles, tags and lyrics for AI re-ranking."""
    q = query.lower()
    terms = [t for t in q.replace(",", " ").split() if len(t) > 2]
    scored: list[tuple[int, dict]] = []
    for song in list_songs():
        hay = " ".join(
            [song.get("title", ""), " ".join(song.get("tags", [])), song.get("lyrics", "")]
        ).lower()
        score = sum(hay.count(t) for t in terms) + (3 if q in song.get("title", "").lower() else 0)
        if score:
            scored.append((score, song))
    scored.sort(key=lambda x: x[0], reverse=True)
    if not scored:  # fall back to a sample so the model still has something to rank
        return list_songs()[:cap]
    return [s for _, s in scored[:cap]]


# --- Folders ---


def list_folders() -> list[dict]:
    out = [{**(d.to_dict() or {}), "id": d.id} for d in db().collection(FOLDERS).stream()]
    out.sort(key=lambda f: (f.get("order", 0), f.get("name", "")))
    return out


def ensure_folder(name: str) -> dict:
    fid = slugify(name)[:100] or "folder"
    ref = db().collection(FOLDERS).document(fid)
    snap = ref.get()
    if snap.exists:
        return {**(snap.to_dict() or {}), "id": fid}
    doc = {"name": name, "order": 0}
    ref.set(doc)
    return {**doc, "id": fid}


def rename_folder(fid: str, new_name: str) -> dict | None:
    ref = db().collection(FOLDERS).document(fid)
    snap = ref.get()
    if not snap.exists:
        return None
    old_name = (snap.to_dict() or {}).get("name")
    ref.update({"name": new_name})
    if old_name:
        batch = db().batch()
        for d in db().collection(SONGS).where(filter=FieldFilter("folder", "==", old_name)).stream():
            batch.update(d.reference, {"folder": new_name})
        batch.commit()
    return {**(ref.get().to_dict() or {}), "id": fid}


def delete_folder(fid: str, *, cascade: bool) -> bool:
    ref = db().collection(FOLDERS).document(fid)
    snap = ref.get()
    if not snap.exists:
        return False
    name = (snap.to_dict() or {}).get("name")
    if cascade and name:
        batch = db().batch()
        for d in db().collection(SONGS).where(filter=FieldFilter("folder", "==", name)).stream():
            batch.delete(d.reference)
        batch.commit()
    ref.delete()
    return True
