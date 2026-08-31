from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.auth import CurrentUser, get_current_user
from app.firebase import db

router = APIRouter(tags=["me"])


@router.get("/me")
async def me(user: CurrentUser = Depends(get_current_user)):
    """Return the caller's identity/role and record a lightweight 'last seen'."""
    db().collection("users").document(user.uid).set(
        {
            "email": user.email,
            "display_name": user.name,
            "role": user.role,
            "last_seen": datetime.now(timezone.utc).isoformat(),
        },
        merge=True,
    )
    return {"uid": user.uid, "email": user.email, "name": user.name, "role": user.role}
