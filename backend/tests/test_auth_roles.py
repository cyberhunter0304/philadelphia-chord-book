import pytest
from fastapi import HTTPException

from app.auth import CurrentUser, require_role


async def _call(dep, user):
    return await dep(user=user)


@pytest.mark.asyncio
async def test_require_role_allows():
    admin = CurrentUser(uid="1", email=None, name=None, role="admin")
    assert (await _call(require_role("admin"), admin)).uid == "1"


@pytest.mark.asyncio
async def test_require_role_denies():
    user = CurrentUser(uid="2", email=None, name=None, role="user")
    with pytest.raises(HTTPException) as exc:
        await _call(require_role("admin"), user)
    assert exc.value.status_code == 403


def test_is_admin_flag():
    assert CurrentUser("1", None, None, "admin").is_admin
    assert not CurrentUser("2", None, None, "user").is_admin
