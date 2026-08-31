# Philadelphia Chord Book

A worship chord book: browse and present chord charts, transpose on the fly,
build setlists, and use AI (Google Gemini) to generate charts, plan setlists,
simplify/reharmonize chords, and search by theme.

| Layer | Tech |
|---|---|
| Frontend | Vite + React 19, Tailwind v4, Radix primitives, React Router 7 → **Firebase Hosting** |
| Backend | FastAPI (Python 3.12), Firebase Admin SDK, `google-genai` → **Google Cloud Run** |
| Data | **Firestore** (`songs`, `folders`, `setlists`, `users`, `usage`) |
| Auth | **Firebase Auth** (Google) with `admin` / `user` roles via custom claims |
| AI | **Gemini 3.6 Flash** via Google AI Studio |
| Files *(optional)* | **Firebase Storage** for attachments — needs the Blaze plan; leave `STORAGE_BUCKET` blank to disable |

Reads come straight from Firestore (real-time, offline-capable). Every **write**
goes through the FastAPI backend, which verifies the Firebase ID token, checks the
role, and talks to Firestore with the Admin SDK. Firestore rules therefore allow
public reads and deny all client writes.

Project id in use: **`philadelphia-toolkit-fd760`**.

## Roles

- **visitor (signed out)** — browse the library, transpose, present, open shared setlists.
- **user** — + create/edit songs, all AI tools, personal & shared setlists.
- **admin** — + delete songs, rename/delete folders, manage user roles.

First admin: set `BOOTSTRAP_ADMIN_EMAILS` in `backend/.env` (auto-promoted on first
sign-in) or run `python backend/scripts/set_role.py --email you@example.com --role admin`.

---

## One-time setup

1. **Firebase project** → enable **Authentication → Google**, create **Firestore**
   (Native mode, `(default)`, region `asia-south1`).
2. **Firestore rules** — publish `firestore.rules` (console → Firestore → Rules, or
   `firebase deploy --only firestore:rules`). Without this the client can't read.
3. **Gemini key** → <https://aistudio.google.com/app/apikey> → `backend/.env` `GOOGLE_API_KEY`.
4. **`backend/.env`** — copy from `.env.example`; it points at `serviceAccountKey.json`
   (Firebase console → Project settings → Service accounts → Generate new private key).
5. **`.env.local`** — copy from `.env.example`; fill the `VITE_FIREBASE_*` values from
   Project settings → Your apps → Web app SDK config.

## Run locally

```powershell
# terminal 1 — backend (run from backend\)
cd backend
.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8080

# one-time — seed Firestore from data/songs.json (7 folders, ~479 songs)
.\.venv\Scripts\python.exe scripts\migrate_songs.py

# terminal 2 — frontend
npm run dev
```

`data/songs.json` stays in the repo as the migration source and a backup.

### Emulators (optional)

Set the `*_EMULATOR_HOST` vars in `backend/.env` and `VITE_USE_EMULATORS=true` in
`.env.local`, then `firebase emulators:start` (Auth 9099, Firestore 8081, UI 4000).

### Tests

```powershell
npm test                                      # chord parse/transpose (vitest) + app mount
cd backend; .\.venv\Scripts\python.exe -m pytest -q
```

---

## Deploy — backend on Render, frontend on Vercel

Both deploy straight from the GitHub repo and redeploy on every push to `main`.

### 1. Backend → Render (`render.yaml`)

1. [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint** → pick this repo.
   Render reads `render.yaml` and creates the `chordbook-api` web service (free plan, Singapore).
2. When it asks for the two `sync: false` secrets, set:
   - `GOOGLE_API_KEY` — your Google AI Studio key
   - `FIREBASE_SERVICE_ACCOUNT_JSON` — paste the **entire contents** of
     `backend/serviceAccountKey.json` (one value, newlines and all)
3. First deploy takes a few minutes. Note the URL: `https://chordbook-api.onrender.com`.

Free instances sleep after ~15 min idle; the next request cold-starts (~50s). Song
browsing still works while asleep (it reads Firestore directly) — only sign-in, edits
and AI wait for the wake-up.

### 2. Frontend → Vercel

[vercel.com/new](https://vercel.com/new) → import the repo (auto-detects Vite;
`vercel.json` handles the SPA rewrite and ignores `backend/`). **Environment
Variables** → Production:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://chordbook-api.onrender.com` (from step 1) |
| `VITE_FIREBASE_API_KEY` | `AIzaSyB3ii-o2A5C_TRzhJhMGEAvQ5UyUYj5nmo` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `philadelphia-toolkit-fd760.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `philadelphia-toolkit-fd760` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123115491899` |
| `VITE_FIREBASE_APP_ID` | `1:123115491899:web:89f2302b200b97e75f821e` |

Deploy, then **redeploy** if you added the vars after the first build (Vite inlines
them at build time).

### 3. Wire the two together

1. **Firebase Console → Authentication → Settings → Authorized domains** → add your
   `<project>.vercel.app` domain (and any custom domain). Without this, Google sign-in
   fails with `auth/unauthorized-domain`.
2. If your Vercel domain isn't `philadelphia-chord-book.vercel.app`, update
   `ALLOWED_ORIGINS` in the Render service's env vars to match. (The backend also
   allows any `*.vercel.app` by regex, so preview deployments already work.)
3. **Firestore rules** — publish `firestore.rules` (console → Firestore → Rules).

`.github/workflows/ci.yml` runs both test suites on PRs.

---

## AI endpoints (all `POST`, bearer token, per-user daily quota)

| Endpoint | Purpose |
|---|---|
| `/ai/generate-chords` | lyrics + inline `[chord]` chart for a title (review before save) |
| `/ai/setlist` | ordered setlist from a theme, picking only charted songs |
| `/ai/assistant` | per-song: `simplify` / `reharmonize` / `number-notation` / `explain` |
| `/ai/search` | keyword prefilter → Gemini re-rank by theme/mood |
| `/ai/cleanup` | normalize chart spacing/alignment without changing the music |

Chord-chart format contract: [`backend/app/gemini.py`](backend/app/gemini.py);
parser/transposer: [`src/lib/chords.js`](src/lib/chords.js).


1. Mother Copy - Default Fallback
2. Version control - Logging (CRUD)
3. Frequent Backups

