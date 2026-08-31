"""Auth dependencies: verify Firebase ID tokens and enforce roles."""
from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status

from app.config import get_settings
from app.firebase import auth_client

Role = str  # "admin" | "user"


@dataclass
class CurrentUser:
    uid: str
    email: str | None
    name: str | None
    role: Role  # defaults to "user" when no claim is present

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"


async def get_current_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        decoded = auth_client().verify_id_token(token)
    except Exception as exc:  # noqa: BLE001 - firebase raises many subclasses
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid token: {exc}") from exc

    email = decoded.get("email")
    role = decoded.get("role", "user")

    # First-run bootstrap: promote configured emails to admin once.
    if role != "admin" and email and email.lower() in get_settings().bootstrap_admins:
        try:
            auth_client().set_custom_user_claims(decoded["uid"], {"role": "admin"})
        except Exception:  # noqa: BLE001 - best effort; token still treated as admin
            pass
        role = "admin"

    return CurrentUser(
        uid=decoded["uid"],
        email=email,
        name=decoded.get("name"),
        role=role,
    )


async def get_optional_user(
    authorization: str | None = Header(default=None),
) -> CurrentUser | None:
    if not authorization:
        return None
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None


def require_role(*allowed: Role):
    async def _dep(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in allowed:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Requires role: {' or '.join(allowed)}",
            )
        return user

    return _dep


# Convenience dependencies
require_user = require_role("user", "admin")
require_admin = require_role("admin")
