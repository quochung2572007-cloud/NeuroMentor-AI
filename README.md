# NeuroMentor AI

Your cognitive wellness copilot.

NeuroMentor turns daily screen-time metadata into explainable estimates for:

- Focus
- Mental fatigue
- Digital distraction
- Burnout tendency
- Productive and recovery balance

This repository contains a responsive web app, a Chrome extension using the same interface, a
Supabase-backed persistence layer, and an optional FastAPI backend. Both clients still work locally
without an account or server. When Supabase is configured, signed-in users keep their snapshots,
behavior metrics, trends, and mentor history across browsers and devices.

## MVP Features

- Four-view extension dashboard: Overview, Analyze, Trends, and Mentor
- First-run login, sign-up, forgot-password, and persistent Supabase sessions
- Account panel, logout, offline guest mode, and automatic account-linked usage sync
- Manual category entry for Screen Time and Digital Wellbeing totals
- Screenshot upload, drag-and-drop, clipboard paste, editable extraction review, replace, and remove workflow
- Configurable daily email when today's Screen Time has not been added
- Bundled local Tesseract OCR with confidence indicators and required review before values are saved
- Explainable focus, fatigue, distraction, and burnout tendency scores
- Behavioral alerts for social overload, attention fragmentation, late-night use, and overload
- Supabase-backed trend history with local cache fallback
- Context-aware mentor questions
- Privacy-first local fallback through `chrome.storage.local`
- Row-level-secured database persistence for signed-in users
- FastAPI prediction and mentor endpoints
- Existing JWT, device, usage session, report, feedback, and PostgreSQL infrastructure

## Run The Extension

1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project folder.
5. Pin **NeuroMentor AI** from Chrome's extensions menu.
6. Open the extension and choose **Log in**, **Sign up**, or **Continue offline**.
7. Enter today's usage under **Analyze**.

After changing extension files, click the reload icon on `chrome://extensions/`.

## Daily Screen Time Reminders

Signed-in users can receive one email each day when today's Screen Time has not been uploaded.
The reminder uses the user's local timezone, defaults to 8:00 PM, and stays quiet after that day's
usage reaches the backend.

Production email uses the Resend API, so users never provide an email password. The site owner
configures one API key and a verified sending domain:

```env
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=NeuroMentor AI <reminders@updates.your-domain.com>
```

Resend requires a domain you own and verify before sending to all users:
<https://resend.com/docs/dashboard/domains/introduction>

For local development, the backend process performs reminder checks. In production, the Render
cron job performs them independently of the sleeping free API service.

## Supabase Auth And Persistence

Supabase is the source of truth for signed-in users. The browser keeps a small local cache only for
performance and offline tolerance; account data is restored from Supabase after login.

### 1. Create The Supabase Tables

1. Create a Supabase project at <https://supabase.com/dashboard/projects>.
2. Open **SQL Editor** in Supabase.
3. Paste and run `supabase/migrations/001_neurommentor_persistence.sql`.
4. Confirm these tables exist: `profiles`, `snapshots`, `behavior_metrics`, and
   `mentor_messages`.

The migration enables Row Level Security so each user can only read or write their own records.
Supabase Auth stores passwords and password hashes internally in `auth.users`; NeuroMentor does not
duplicate password hashes in public application tables.

### 2. Enable Auth Providers

In **Authentication > Providers**:

- Enable **Email** for email/password sign-up and login.
- For local testing, either disable email confirmation or confirm the account from the email before
  logging in.

Add these redirect URLs in **Authentication > URL Configuration**:

```text
http://127.0.0.1:5500/
http://localhost:5500/
https://neuro-mentor-ai.vercel.app/
```

If your Vercel project uses a different domain, add that exact domain too.

### 3. Connect The Frontend

For local development, open `config.js` and fill in your public Supabase project URL and anon key:

```js
globalThis.NEUROMENTOR_CONFIG = Object.freeze({
  apiRoot: localHosts.has(currentHost) ? localApiRoot : productionApiRoot,
  supabase: {
    url: 'https://YOUR_PROJECT.supabase.co',
    anonKey: 'YOUR_PUBLIC_ANON_KEY',
  },
});
```

The anon key is safe to use in frontend code because Row Level Security protects user data. Never put
the Supabase `service_role` key in this repository or in browser code.

After this is configured:

- Sign-up logs the user in automatically when email confirmation is disabled.
- Login loads the latest snapshot, trend history, personal baseline, and mentor messages.
- Generating a cognitive snapshot automatically saves the snapshot and behavior metrics.
- Sending a Mentor message automatically saves both the user message and Mentor response.
- Updating extracted or manual behavior values automatically syncs the latest daily behavior row.

For Vercel production, set these environment variables instead of hard-coding secrets in the repo:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
NEUROMENTOR_API_ROOT=https://neurommentor-api-khaivan2210.onrender.com/v1
```

The frontend reads them from `/api/config` at startup. `SUPABASE_SERVICE_ROLE_KEY` is not required
by the browser app and must not be exposed through Vercel client code.

## Production Deployment

The deployment files use this stack:

- Frontend: Vercel
- Auth and account persistence: Supabase
- API: Render free web service, optional for legacy account APIs, prediction, and email reminders
- Scheduler: Render cron job every 10 minutes
- Database: Supabase PostgreSQL for account history; Render PostgreSQL only if you use the FastAPI backend
- Email: Resend free plan

The Render database is currently `$6/month`; cron execution starts around `$1/month`. Vercel Hobby
and Resend can start free within their usage limits. Confirm current pricing before creating cloud
resources:

- <https://render.com/pricing>
- <https://vercel.com/pricing>
- <https://resend.com/pricing>

### 1. Publish To GitHub

Create a repository named `neurommentor-ai`, then push this project:

```powershell
git init
git add .
git commit -m "Prepare NeuroMentor for production deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/neurommentor-ai.git
git push -u origin main
```

The checked-in `.gitignore` excludes the local database and `backend/.env`.

### 2. Deploy Render

1. Open <https://dashboard.render.com/blueprints>.
2. Create a Blueprint from the GitHub repository.
3. Render reads `render.yaml` and proposes the API, cron job, and PostgreSQL database.
4. Confirm the displayed monthly price before applying.
5. Enter `RESEND_API_KEY` and `EMAIL_FROM` when Render prompts for them.
6. Wait for `alembic upgrade head` and the API deploy to complete.
7. Verify `https://neurommentor-api-khaivan2210.onrender.com/health`.

### 3. Deploy Vercel

1. Import the same GitHub repository at <https://vercel.com/new>.
2. Set the project name to `neuro-mentor-ai`.
3. Select **Other** as the framework preset and leave the root directory as the repository root.
4. Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and optionally `NEUROMENTOR_API_ROOT` in
   **Project Settings > Environment Variables**.
5. Deploy without a build command; `vercel.json` serves the static app and `/api/config` exposes the
   public runtime auth config.
6. Open `https://neuro-mentor-ai.vercel.app`.
7. Verify `https://neuro-mentor-ai.vercel.app/api/config` returns `"authProvider":"supabase"`.

`git push` deploys code, but it does not create Vercel environment variables. If `/api/config`
returns `"authProvider":"unconfigured"`, add the Supabase variables in Vercel and redeploy.

If either generated hostname changes, update `config.js`, Supabase redirect URLs, `render.yaml`, and
the Render `APP_PUBLIC_URL` / `CORS_ALLOWED_ORIGINS` values, then redeploy.

## Run The Web App

From the project folder, start a local web server:

```powershell
python -m http.server 5500
```

Open `http://localhost:5500/` in Chrome. The root page opens the responsive NeuroMentor web app.

The web app works on desktop and mobile browser widths. Choose **Continue offline** if Supabase is
not configured or you want to test guest mode. For account login and automatic cross-device history,
configure Supabase above.

## Use Without The Backend

Choose **Continue offline** on the welcome screen. No setup is required. The app calculates scores
locally and stores temporary versioned daily snapshots plus the mentor conversation in browser
storage. Overview, Analyze, Trends, and Mentor all read the same snapshot model.

The **Local** indicator in the header confirms this mode.

## Run The Account Backend

Requirements:

- Python 3.11+

Create and activate a virtual environment:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Start FastAPI:

```powershell
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The development server creates `backend/neurommentor.db` automatically, so Docker is not required.
Keep this terminal open while using login, signup, or cloud sync.
It must also remain open for daily email reminders.

Open API documentation at `http://localhost:8000/docs`.

When the API responds, the extension header changes from **Local** to **API** after an analysis.

### Optional PostgreSQL Setup

For PostgreSQL, copy `.env.example` to `.env`, change `DATABASE_URL` to the PostgreSQL connection
string from `docker-compose.yml`, set `AUTO_CREATE_TABLES=false`, and run:

```powershell
docker compose up -d
alembic upgrade head
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Accounts

Account features use Supabase when `config.js` contains a valid Supabase URL and anon key. The
FastAPI backend remains available for older local account testing, prediction endpoints, and email
reminders.

- Registration uses email and a password of at least eight characters.
- The app stores the Supabase session in browser storage and restores it when reopened.
- New analyses are saved automatically to `snapshots` and `behavior_metrics`.
- Mentor chat saves both user and mentor messages to `mentor_messages`.
- The account menu in the top-right corner shows connection status and provides logout.
- If Supabase is not configured or becomes unavailable, users can continue with offline local analysis.

## Intelligence API

Prediction:

```http
POST /v1/intelligence/predict
```

Example payload:

```json
{
  "usage": {
    "social": 60,
    "productivity": 150,
    "games": 20,
    "learning": 75,
    "health": 30,
    "entertainment": 45
  },
  "app_switches": 32,
  "late_night_minutes": 20,
  "deep_work_minutes": 90,
  "launch_count": 48
}
```

Mentor:

```http
POST /v1/intelligence/chat
```

The existing authenticated APIs remain under:

- `/v1/auth`
- `/v1/devices`
- `/v1/usage`
- `/v1/reports`

## Architecture

```text
Chrome Extension
  |-- Account login, signup, and offline guest mode
  |-- Supabase Auth sessions and account-linked daily usage sync
  |-- Local analysis fallback
  |-- Versioned daily snapshots shared by every screen
  |-- Supabase history with local cache fallback
  |-- Screenshot import
  |
Responsive Web App
  |-- Same account and analysis experience
  |-- Desktop and mobile layouts
  |-- Browser local-storage fallback
  |
  +-- Vercel static hosting
  |
  +-- Supabase Auth + Postgres
        |-- Row-level-secured profiles
        |-- Snapshots and behavior metrics
        |-- Mentor messages
  |
  +-- Render FastAPI /v1
        |-- Pure shared scoring rules with browser parity fixtures
        |-- Explainable alerts
        |-- Mentor response builder
        |-- Authenticated reminder settings
        |
        +-- Render PostgreSQL
        +-- Render reminder cron
        +-- Resend email API
```

## Privacy And Scope

The MVP processes usage metadata such as category minutes, app switches, late-night minutes, and
deep-work minutes. It does not collect messages, browsing content, or keystrokes. Screenshots that
the user explicitly selects or pastes are processed locally in the extension and are not uploaded.

Scores are behavioral wellness estimates, not medical or mental-health diagnoses.

## Verification

Install development-only checks, then run linting, type checking, and tests:

```powershell
cd backend
pip install -r requirements-dev.txt
python -m ruff check app tests
python -m mypy app/services/scoring.py app/services/intelligence_engine.py app/schemas/intelligence.py app/schemas/usage.py tests/test_scoring.py
python -m unittest discover -s tests -v
```

The frontend is static and has no compile step. Serve the repository root as described above. Browser
tests live in `tests/core.browser.test.html`; shared score fixtures live in
`tests/fixtures/scoring_cases.json` and are also exercised by the backend tests.

Backend configuration is documented in `backend/.env.example`. Local-only mode needs no environment
variables. Supabase account persistence needs the public Supabase URL and anon key in `config.js`.
The optional FastAPI backend needs `DATABASE_URL` and a non-default `JWT_SECRET`; production email
delivery needs `RESEND_API_KEY`, `EMAIL_FROM`, and `APP_PUBLIC_URL`. Production deployments should
also set `CORS_ALLOWED_ORIGINS` and disable `AUTO_CREATE_TABLES` after migrations are configured.

## Main Files

- `index.html` - Multi-view NeuroMentor web and extension interface
- `popup.html` - Compatibility redirect to the main app
- `popup.css` - Popup layout and visual system
- `popup.js` - Local intelligence, trends, mentor, storage, and API fallback
- `core.js` - Versioned snapshots, pure calculations, validation, trends, and deterministic Mentor logic
- `runtime.js` - Web/extension runtime detection
- `config.js` - Local and production API routing plus Supabase client configuration
- `api/config.js` - Vercel runtime config endpoint for public Supabase and API settings
- `supabase/migrations/001_neurommentor_persistence.sql` - Supabase Auth, tables, indexes, triggers, and RLS policies
- `vercel.json` - Vercel static hosting and security headers
- `render.yaml` - Render API, cron job, and PostgreSQL Blueprint
- `assets/neurommentor-logo.png` - Full-resolution transparent NeuroMentor brand mark
- `site.webmanifest` - Installable web-app metadata and logo icons
- `backend/app/services/scoring.py` - Pure backend scoring and validation functions
- `backend/app/services/intelligence_engine.py` - API and Mentor adapters around the pure scorer
- `backend/app/routers/intelligence.py` - Prediction and mentor endpoints
- `backend/app/services/report_engine.py` - Adapter for persisted daily reports
