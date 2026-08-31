from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from slugify import slugify

from app.auth import CurrentUser, get_optional_user, require_user
from app.config import get_settings
from app.firebase import bucket
from app.services import songs_service as songs

router = APIRouter(prefix="/attachments", tags=["attachments"])


def _require_storage() -> None:
    if not get_settings().storage_enabled:
        raise HTTPException(
            status_code=501,
            detail="Attachments are disabled — Firebase Storage is not configured.",
        )


class UploadUrlIn(BaseModel):
    filename: str
    content_type: str = "application/octet-stream"


class UploadUrlOut(BaseModel):
    upload_url: str
    object_path: str
    public_url: str


def _prefix(song_id: str) -> str:
    return f"song-attachments/{song_id}/"


@router.get("/{song_id}")
async def list_attachments(song_id: str, _: CurrentUser | None = Depends(get_optional_user)):
    if not get_settings().storage_enabled:
        return []
    blobs = bucket().list_blobs(prefix=_prefix(song_id))
    return [
        {
            "name": b.name.rsplit("/", 1)[-1],
            "object_path": b.name,
            "size": b.size,
            "content_type": b.content_type,
            "public_url": b.public_url,
        }
        for b in blobs
    ]


@router.post("/{song_id}/upload-url", response_model=UploadUrlOut)
async def create_upload_url(
    song_id: str, body: UploadUrlIn, _: CurrentUser = Depends(require_user)
):
    _require_storage()
    if not songs.get_song(song_id):
        raise HTTPException(404, "Song not found")
    safe = slugify(body.filename, separator="-", lowercase=False, regex_pattern=r"[^\w.\-]+")
    obj = f"{_prefix(song_id)}{safe or 'file'}"
    blob = bucket().blob(obj)
    url = blob.generate_signed_url(
        version="v4", expiration=timedelta(minutes=15), method="PUT",
        content_type=body.content_type,
    )
    return UploadUrlOut(upload_url=url, object_path=obj, public_url=blob.public_url)


@router.delete("/{song_id}/{filename}", status_code=204)
async def delete_attachment(
    song_id: str, filename: str, _: CurrentUser = Depends(require_user)
):
    _require_storage()
    blob = bucket().blob(f"{_prefix(song_id)}{filename}")
    if not blob.exists():
        raise HTTPException(404, "Attachment not found")
    blob.delete()
