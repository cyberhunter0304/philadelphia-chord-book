from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.auth import CurrentUser, require_admin
from app.firebase import auth_client, db
from app.models import RoleUpdate, UserSummary

router = APIRouter(prefix="/admin", tags=["admin"])

USERS = "users"


@router.get("/users", response_model=list[UserSummary])
async def list_users(_: CurrentUser = Depends(require_admin)):
    out: list[UserSummary] = []
    for u in auth_client().list_users().iterate_all():
        claims = u.custom_claims or {}
        profile = db().collection(USERS).document(u.uid).get()
        last_seen = (profile.to_dict() or {}).get("last_seen") if profile.exists else None
        out.append(
            UserSummary(
                uid=u.uid,
                email=u.email,
                display_name=u.display_name,
                role=claims.get("role", "user"),
                last_seen=last_seen,
            )
        )
    return out


@router.put("/users/{uid}/role", response_model=UserSummary)
async def set_role(uid: str, body: RoleUpdate, admin: CurrentUser = Depends(require_admin)):
    if uid == admin.uid and body.role != "admin":
        raise HTTPException(400, "You cannot demote yourself")
    try:
        user = auth_client().get_user(uid)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(404, f"User not found: {exc}") from exc

    auth_client().set_custom_user_claims(uid, {"role": body.role})
    db().collection(USERS).document(uid).set(
        {
            "email": user.email,
            "display_name": user.display_name,
            "role": body.role,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        merge=True,
    )
    return UserSummary(
        uid=uid, email=user.email, display_name=user.display_name, role=body.role
    )
