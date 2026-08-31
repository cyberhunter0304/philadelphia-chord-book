from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.firebase import init_firebase
from app.routers import admin, ai, attachments, folders, me, setlists, songs

logging.basicConfig(level=logging.INFO)

settings = get_settings()
app = FastAPI(title="Philadelphia Chord Book API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    # Firebase Hosting preview/live + Vercel production & preview deployments.
    allow_origin_regex=r"https://.*\.(web\.app|firebaseapp\.com|vercel\.app)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    init_firebase()


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {
        "ok": True,
        "emulators": settings.use_emulators,
        "model": settings.gemini_model,
        "storage": settings.storage_enabled,
    }


for r in (me.router, songs.router, folders.router, setlists.router, ai.router, admin.router, attachments.router):
    app.include_router(r)
