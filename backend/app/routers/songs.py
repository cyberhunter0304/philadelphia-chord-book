from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.auth import CurrentUser, get_optional_user, require_admin, require_user
from app.models import Song, SongIn, SongPatch
from app.services import songs_service as svc

router = APIRouter(prefix="/songs", tags=["songs"])


@router.get("", response_model=list[Song])
async def list_songs(_: CurrentUser | None = Depends(get_optional_user)):
    return svc.list_songs()


@router.get("/{sid}", response_model=Song)
async def get_song(sid: str, _: CurrentUser | None = Depends(get_optional_user)):
    song = svc.get_song(sid)
    if not song:
        raise HTTPException(404, "Song not found")
    return song


@router.post("", response_model=Song, status_code=201)
async def create_song(body: SongIn, user: CurrentUser = Depends(require_user)):
    return svc.create_song(body.model_dump(), created_by=user.uid)


@router.patch("/{sid}", response_model=Song)
async def update_song(sid: str, body: SongPatch, _: CurrentUser = Depends(require_user)):
    song = svc.update_song(sid, body.model_dump(exclude_unset=True))
    if not song:
        raise HTTPException(404, "Song not found")
    return song


@router.delete("/{sid}", status_code=204)
async def delete_song(sid: str, _: CurrentUser = Depends(require_admin)):
    if not svc.delete_song(sid):
        raise HTTPException(404, "Song not found")
