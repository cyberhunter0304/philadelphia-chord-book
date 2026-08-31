"""Firebase Admin SDK initialization and shared client accessors."""
from __future__ import annotations

import json
import os
from pathlib import Path

import firebase_admin
from firebase_admin import auth as fb_auth
from firebase_admin import credentials, firestore, storage

from app.config import get_settings

_app: firebase_admin.App | None = None


def init_firebase() -> firebase_admin.App:
    global _app
    if _app is not None:
        return _app

    settings = get_settings()

    # Wire emulator env vars before the SDK initializes.
    if settings.firestore_emulator_host:
        os.environ.setdefault("FIRESTORE_EMULATOR_HOST", settings.firestore_emulator_host)
    if settings.firebase_auth_emulator_host:
        os.environ.setdefault("FIREBASE_AUTH_EMULATOR_HOST", settings.firebase_auth_emulator_host)
    if settings.firebase_storage_emulator_host:
        os.environ.setdefault(
            "FIREBASE_STORAGE_EMULATOR_HOST", settings.firebase_storage_emulator_host
        )

    options = {"projectId": settings.firebase_project_id}
    if settings.storage_bucket:
        options["storageBucket"] = settings.storage_bucket

    key_path = settings.google_application_credentials
    if key_path and not os.path.isabs(key_path):
        # Resolve relative to the backend/ directory, not the current working dir.
        candidate = Path(__file__).resolve().parents[1] / key_path
        if candidate.exists():
            key_path = str(candidate)

    if settings.firebase_service_account_json:
        # Serverless hosts (no key file): the whole JSON as a single env var.
        cred = credentials.Certificate(json.loads(settings.firebase_service_account_json))
    elif key_path and os.path.exists(key_path):
        cred = credentials.Certificate(key_path)
    elif settings.use_emulators:
        cred = None
    else:
        # Cloud Run: the runtime service account via Application Default Credentials.
        cred = credentials.ApplicationDefault()

    _app = firebase_admin.initialize_app(cred, options)
    return _app


def db() -> firestore.Client:
    init_firebase()
    return firestore.client()


def auth_client():
    init_firebase()
    return fb_auth


def bucket():
    init_firebase()
    return storage.bucket()
