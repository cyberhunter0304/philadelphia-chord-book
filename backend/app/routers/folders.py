from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth import CurrentUser, get_optional_user, require_admin, require_user
from app.models import Folder, FolderIn
from app.services import songs_service as svc

router = APIRouter(prefix="/folders", tags=["folders"])


@router.get("", response_model=list[Folder])
async def list_folders(_: CurrentUser | None = Depends(get_optional_user)):
    return svc.list_folders()


@router.post("", response_model=Folder, status_code=201)
async def create_folder(body: FolderIn, _: CurrentUser = Depends(require_user)):
    return svc.ensure_folder(body.name)


@router.patch("/{fid}", response_model=Folder)
async def rename_folder(fid: str, body: FolderIn, _: CurrentUser = Depends(require_admin)):
    folder = svc.rename_folder(fid, body.name)
    if not folder:
        raise HTTPException(404, "Folder not found")
    return folder


@router.delete("/{fid}", status_code=204)
async def delete_folder(
    fid: str,
    cascade: bool = Query(default=False, description="also delete songs in the folder"),
    _: CurrentUser = Depends(require_admin),
):
    if not svc.delete_folder(fid, cascade=cascade):
        raise HTTPException(404, "Folder not found")
