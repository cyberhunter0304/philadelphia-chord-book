"""Firestore access for setlists."""
from __future__ import annotations

from google.cloud.firestore_v1 import FieldFilter

from app.firebase import db

SETLISTS = "setlists"


def _doc(d) -> dict:
    return {**(d.to_dict() or {}), "id": d.id}


def list_for_user(uid: str, *, is_admin: bool) -> list[dict]:
    col = db().collection(SETLISTS)
    if is_admin:
        return [_doc(d) for d in col.stream()]
    own = {d.id: _doc(d) for d in col.where(filter=FieldFilter("owner_uid", "==", uid)).stream()}
    shared = {d.id: _doc(d) for d in col.where(filter=FieldFilter("shared", "==", True)).stream()}
    return list({**shared, **own}.values())


def get(sid: str) -> dict | None:
    snap = db().collection(SETLISTS).document(sid).get()
    return _doc(snap) if snap.exists else None


def can_view(setlist: dict, uid: str, *, is_admin: bool) -> bool:
    return is_admin or setlist.get("shared") or setlist.get("owner_uid") == uid


def can_edit(setlist: dict, uid: str, *, is_admin: bool) -> bool:
    return is_admin or setlist.get("owner_uid") == uid


def create(payload: dict, *, owner_uid: str) -> dict:
    doc = {**payload, "owner_uid": owner_uid}
    ref = db().collection(SETLISTS).document()
    ref.set(doc)
    return {**doc, "id": ref.id}


def update(sid: str, payload: dict) -> dict | None:
    ref = db().collection(SETLISTS).document(sid)
    if not ref.get().exists:
        return None
    ref.update(payload)
    return get(sid)


def delete(sid: str) -> bool:
    ref = db().collection(SETLISTS).document(sid)
    if not ref.get().exists:
        return False
    ref.delete()
    return True
