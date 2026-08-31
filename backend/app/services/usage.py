"""Per-user daily AI usage limiting, backed by Firestore transactions."""
from __future__ import annotations

from datetime import date

from fastapi import HTTPException, status
from google.cloud import firestore

from app.config import get_settings
from app.firebase import db

USAGE = "usage"


def check_and_increment(uid: str, *, is_admin: bool) -> int:
    """Raise 429 if the caller is over their daily cap; otherwise record the call."""
    settings = get_settings()
    limit = settings.ai_daily_limit_admin if is_admin else settings.ai_daily_limit_user
    today = date.today().isoformat()
    ref = db().collection(USAGE).document(uid)

    @firestore.transactional
    def _txn(txn) -> int:
        snap = ref.get(transaction=txn)
        data = snap.to_dict() or {}
        count = data.get("ai_calls", 0) if data.get("day") == today else 0
        if count >= limit:
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS,
                f"Daily AI limit reached ({limit}). Try again tomorrow.",
            )
        txn.set(ref, {"day": today, "ai_calls": count + 1}, merge=True)
        return count + 1

    return _txn(db().transaction())


def usage_for(uid: str) -> dict:
    snap = db().collection(USAGE).document(uid).get()
    data = snap.to_dict() or {}
    today = date.today().isoformat()
    return {
        "day": today,
        "ai_calls": data.get("ai_calls", 0) if data.get("day") == today else 0,
    }
