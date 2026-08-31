"""Application settings, loaded from environment variables (.env in local dev)."""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Firebase ---
    firebase_project_id: str = "philadelphia-toolkit-fd760"
    # Optional path to a service-account JSON key. Leave empty in Cloud Run: the
    # runtime service account is used via Application Default Credentials.
    google_application_credentials: str | None = None
    # Alternative for serverless hosts: the entire service-account JSON as one env var.
    firebase_service_account_json: str | None = None
    # Set only if Firebase Storage is enabled (Blaze plan). Blank => attachments off.
    storage_bucket: str | None = None

    # --- Gemini (Google AI Studio) ---
    google_api_key: str = ""
    gemini_model: str = "gemini-3.6-flash"
    gemini_embedding_model: str = "text-embedding-004"

    # --- App ---
    allowed_origins: str = "http://localhost:5173,http://localhost:4173"
    ai_daily_limit_user: int = 40
    ai_daily_limit_admin: int = 300
    # Comma-separated emails auto-promoted to admin on first authenticated request.
    bootstrap_admin_emails: str = ""

    # Local emulator wiring. When set, firebase-admin talks to the emulators.
    firestore_emulator_host: str | None = None  # "localhost:8081"
    firebase_auth_emulator_host: str | None = None  # "localhost:9099"
    firebase_storage_emulator_host: str | None = None  # "localhost:9199"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def bootstrap_admins(self) -> set[str]:
        return {e.strip().lower() for e in self.bootstrap_admin_emails.split(",") if e.strip()}

    @property
    def use_emulators(self) -> bool:
        return bool(self.firestore_emulator_host or self.firebase_auth_emulator_host)

    @property
    def storage_enabled(self) -> bool:
        return bool(self.storage_bucket)


@lru_cache
def get_settings() -> Settings:
    return Settings()
