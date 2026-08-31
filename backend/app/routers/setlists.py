from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.auth import CurrentUser, require_user
from app.models import Setlist, SetlistIn
from app.services import setlist_service as svc

router = APIRouter(prefix="/setlists", tags=["setlists"])


@router.get("", response_model=list[Setlist])
async def list_setlists(user: CurrentUser = Depends(require_user)):
    return svc.list_for_user(user.uid, is_admin=user.is_admin)


@router.get("/{sid}", response_model=Setlist)
async def get_setlist(sid: str, user: CurrentUser = Depends(require_user)):
    sl = svc.get(sid)
    if not sl or not svc.can_view(sl, user.uid, is_admin=user.is_admin):
        raise HTTPException(404, "Setlist not found")
    return sl


@router.post("", response_model=Setlist, status_code=201)
async def create_setlist(body: SetlistIn, user: CurrentUser = Depends(require_user)):
    return svc.create(body.model_dump(), owner_uid=user.uid)


@router.put("/{sid}", response_model=Setlist)
async def update_setlist(sid: str, body: SetlistIn, user: CurrentUser = Depends(require_user)):
    sl = svc.get(sid)
    if not sl:
        raise HTTPException(404, "Setlist not found")
    if not svc.can_edit(sl, user.uid, is_admin=user.is_admin):
        raise HTTPException(403, "Not your setlist")
    return svc.update(sid, body.model_dump())


@router.delete("/{sid}", status_code=204)
async def delete_setlist(sid: str, user: CurrentUser = Depends(require_user)):
    sl = svc.get(sid)
    if not sl:
        raise HTTPException(404, "Setlist not found")
    if not svc.can_edit(sl, user.uid, is_admin=user.is_admin):
        raise HTTPException(403, "Not your setlist")
    svc.delete(sid)
