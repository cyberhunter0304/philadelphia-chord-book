"""Pydantic request/response schemas."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

# --- Songs ---


class SongIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    folder: str = Field(min_length=1, max_length=100)
    lyrics: str = ""
    key: str = ""
    style: str = ""
    tempo: str | int = ""
    tags: list[str] = []
    # When set, the chart came from the AI generator; recorded as provenance.
    ai_model: str | None = None


class SongPatch(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    folder: str | None = None
    lyrics: str | None = None
    key: str | None = None
    style: str | None = None
    tempo: str | int | None = None
    tags: list[str] | None = None
    ai_model: str | None = None


class Song(SongIn):
    id: str
    needs_chords: bool = False
    ai_generated: bool = False
    ai_model: str | None = None
    created_by: str | None = None
    updated_at: str | None = None


# --- Folders ---


class FolderIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    order: int = 0


class Folder(FolderIn):
    id: str


# --- Setlists ---


class SetlistItem(BaseModel):
    song_id: str
    key_override: str | None = None
    notes: str | None = None


class SetlistIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    shared: bool = False
    date: str | None = None
    items: list[SetlistItem] = []


class Setlist(SetlistIn):
    id: str
    owner_uid: str


# --- Admin ---


class RoleUpdate(BaseModel):
    role: Literal["admin", "user"]


class UserSummary(BaseModel):
    uid: str
    email: str | None
    display_name: str | None
    role: str
    last_seen: str | None = None


# --- AI ---


class GenerateChordsIn(BaseModel):
    title: str = Field(min_length=1)
    key: str = ""
    style: str = ""
    existing_lyrics: str = ""
    language_hint: str = ""


class GenerateChordsOut(BaseModel):
    lyrics: str
    key: str
    notes: str = ""
    model: str


class SetlistSuggestIn(BaseModel):
    theme: str = Field(min_length=1)
    occasion: str = ""
    duration_min: int | None = None
    count: int | None = None


class SetlistPick(BaseModel):
    song_id: str
    title: str
    suggested_key: str = ""
    reason: str = ""


class SetlistSuggestOut(BaseModel):
    picks: list[SetlistPick]
    flow_notes: str = ""
    model: str


AssistantAction = Literal["simplify", "reharmonize", "explain", "number-notation"]


class AssistantIn(BaseModel):
    song_id: str
    action: AssistantAction
    target_level: str = ""  # e.g. "beginner"


class AssistantOut(BaseModel):
    result: str          # transformed chart OR explanation text
    is_chart: bool       # True => result is a replacement lyrics/chords body
    notes: str = ""
    model: str


class SearchIn(BaseModel):
    query: str = Field(min_length=1)
    limit: int = 20


class SearchHit(BaseModel):
    song_id: str
    title: str
    folder: str
    score: float
    reason: str = ""


class SearchOut(BaseModel):
    hits: list[SearchHit]
    model: str


class CleanupIn(BaseModel):
    lyrics: str = Field(min_length=1)


class CleanupOut(BaseModel):
    lyrics: str
    model: str
