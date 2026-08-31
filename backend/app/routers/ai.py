from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.auth import CurrentUser, require_user
from app.gemini import (
    GeminiError,
    assistant as gm_assistant,
    cleanup_chart,
    generate_chords as gm_generate,
    rerank_search,
    suggest_setlist,
)
from app.models import (
    AssistantIn,
    AssistantOut,
    CleanupIn,
    CleanupOut,
    GenerateChordsIn,
    GenerateChordsOut,
    SearchIn,
    SearchOut,
    SetlistSuggestIn,
    SetlistSuggestOut,
)
from app.services import songs_service as songs
from app.services import usage

router = APIRouter(prefix="/ai", tags=["ai"])


def _guard(user: CurrentUser) -> None:
    usage.check_and_increment(user.uid, is_admin=user.is_admin)


def _wrap(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except GeminiError as exc:
        raise HTTPException(502, f"AI provider error: {exc}") from exc


@router.get("/usage")
async def get_usage(user: CurrentUser = Depends(require_user)):
    return usage.usage_for(user.uid)


@router.post("/generate-chords", response_model=GenerateChordsOut)
async def generate_chords(body: GenerateChordsIn, user: CurrentUser = Depends(require_user)):
    _guard(user)
    out = _wrap(
        gm_generate,
        title=body.title,
        key=body.key,
        style=body.style,
        existing_lyrics=body.existing_lyrics,
        language_hint=body.language_hint,
    )
    return GenerateChordsOut(**out)


@router.post("/setlist", response_model=SetlistSuggestOut)
async def ai_setlist(body: SetlistSuggestIn, user: CurrentUser = Depends(require_user)):
    _guard(user)
    library = [
        {k: s.get(k) for k in ("id", "title", "key", "tempo", "style", "tags")}
        for s in songs.list_songs()
        if (s.get("lyrics") or "").strip()  # only songs that actually have a chart
    ]
    if not library:
        raise HTTPException(400, "No songs with chord charts to build a setlist from")
    out = _wrap(
        suggest_setlist,
        theme=body.theme,
        occasion=body.occasion,
        duration_min=body.duration_min,
        count=body.count,
        library=library,
    )
    valid = {s["id"] for s in library}
    out["picks"] = [p for p in out["picks"] if p.get("song_id") in valid]
    return SetlistSuggestOut(**out)


@router.post("/assistant", response_model=AssistantOut)
async def ai_assistant(body: AssistantIn, user: CurrentUser = Depends(require_user)):
    song = songs.get_song(body.song_id)
    if not song:
        raise HTTPException(404, "Song not found")
    if not (song.get("lyrics") or "").strip():
        raise HTTPException(400, "Song has no chart yet")
    _guard(user)
    out = _wrap(
        gm_assistant,
        action=body.action,
        target_level=body.target_level,
        title=song["title"],
        key=song.get("key", ""),
        lyrics=song["lyrics"],
    )
    return AssistantOut(**out)


@router.post("/search", response_model=SearchOut)
async def ai_search(body: SearchIn, user: CurrentUser = Depends(require_user)):
    _guard(user)
    candidates = songs.search_candidates(body.query)
    out = _wrap(rerank_search, query=body.query, candidates=candidates, limit=body.limit)
    by_id = {c["id"]: c for c in candidates}
    hits = []
    for h in out["hits"]:
        c = by_id.get(h.get("song_id"))
        if not c:
            continue
        hits.append(
            {
                "song_id": c["id"],
                "title": c["title"],
                "folder": c.get("folder", ""),
                "score": float(h.get("score", 0)),
                "reason": h.get("reason", ""),
            }
        )
    return SearchOut(hits=hits[: body.limit], model=out["model"])


@router.post("/cleanup", response_model=CleanupOut)
async def ai_cleanup(body: CleanupIn, user: CurrentUser = Depends(require_user)):
    _guard(user)
    return CleanupOut(**_wrap(cleanup_chart, lyrics=body.lyrics))
