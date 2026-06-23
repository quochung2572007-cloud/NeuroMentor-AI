# NeuroMentor AI

Your cognitive wellness copilot.

NeuroMentor turns daily screen-time metadata into explainable estimates for:

- Focus
- Mental fatigue
- Digital distraction
- Burnout tendency
- Productive and recovery balance

This repository contains a responsive web app, a Chrome extension using the same interface, and an
optional FastAPI backend. Both clients work locally without an account or server. When the backend
is available, they use the shared API for accounts, prediction, mentor responses, and usage sync.

## MVP Features

- Four-view extension dashboard: Overview, Analyze, Trends, and Mentor
- First-run login and sign-up experience with persistent JWT sessions
- Account panel, logout, offline guest mode, and authenticated daily usage sync
- Manual category entry for Screen Time and Digital Wellbeing totals
- Screenshot upload, drag-and-drop, clipboard paste, editable extraction review, replace, and remove workflow
- Configurable daily email when today's Screen Time has not been added
- Bundled local Tesseract OCR with confidence indicators and required review before values are saved
- Explainable focus, fatigue, distraction, and burnout tendency scores
- Behavioral alerts for social overload, attention fragmentation, late-night use, and overload
- Seven-day local trend chart
- Context-aware mentor questions
- Privacy-first local fallback through `chrome.storage.local`
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

## Production Deployment

The deployment files use this stack:

- Frontend: Vercel
- API: Render free web service
- Scheduler: Render cron job every 10 minutes
- Database: Render PostgreSQL `basic-256mb`
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
2. Set the project name to `neurommentor-ai-khaivan2210`.
3. Select **Other** as the framework preset and leave the root directory as the repository root.
4. Deploy without a build command; `vercel.json` serves the static app.
5. Open `https://neurommentor-ai-khaivan2210.vercel.app`.

If either generated hostname changes, update `config.js`, `render.yaml`, and the Render
`APP_PUBLIC_URL` / `CORS_ALLOWED_ORIGINS` values, then redeploy.

## Run The Web App

From the project folder, start a local web server:

```powershell
python -m http.server 5500
```

Open `http://localhost:5500/` in Chrome. The root page opens the responsive NeuroMentor web app.

The web app works on desktop and mobile browser widths. Choose **Continue offline** if the FastAPI
backend is not running. For login, signup, and cloud sync, also start the backend below.

## Use Without The Backend

Choose **Continue offline** on the welcome screen. No setup is required. The app calculates scores
locally and stores versioned daily snapshots plus the mentor conversation in browser storage.
Overview, Analyze, Trends, and Mentor all read the same snapshot model.

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

Account features require the FastAPI backend. Start it using the instructions above, reload the
extension or web page, then choose **Sign up**.

- Registration uses email and a password of at least eight characters.
- The extension stores the JWT in `chrome.storage.local` and restores the session when reopened.
- New analyses are saved through the authenticated device and usage APIs.
- The account menu in the top-right corner shows connection status and provides logout.
- If the backend becomes unavailable, an existing signed-in user can continue using local analysis.

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
  |-- Authenticated device and daily usage sync
  |-- Local analysis fallback
  |-- Versioned daily snapshots shared by every screen
  |-- Local history and mentor memory
  |-- Screenshot import
  |
Responsive Web App
  |-- Same account and analysis experience
  |-- Desktop and mobile layouts
  |-- Browser local-storage fallback
  |
  +-- Vercel static hosting
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
variables. Accounts need `DATABASE_URL` and a non-default `JWT_SECRET`; production email delivery
needs `RESEND_API_KEY`, `EMAIL_FROM`, and `APP_PUBLIC_URL`. Production deployments should also set
`CORS_ALLOWED_ORIGINS` and disable `AUTO_CREATE_TABLES` after migrations are configured.

## Main Files

- `index.html` - Multi-view NeuroMentor web and extension interface
- `popup.html` - Compatibility redirect to the main app
- `popup.css` - Popup layout and visual system
- `popup.js` - Local intelligence, trends, mentor, storage, and API fallback
- `core.js` - Versioned snapshots, pure calculations, validation, trends, and deterministic Mentor logic
- `runtime.js` - Web/extension runtime detection
- `config.js` - Local and production API routing
- `vercel.json` - Vercel static hosting and security headers
- `render.yaml` - Render API, cron job, and PostgreSQL Blueprint
- `assets/neurommentor-logo.png` - Full-resolution transparent NeuroMentor brand mark
- `site.webmanifest` - Installable web-app metadata and logo icons
- `backend/app/services/scoring.py` - Pure backend scoring and validation functions
- `backend/app/services/intelligence_engine.py` - API and Mentor adapters around the pure scorer
- `backend/app/routers/intelligence.py` - Prediction and mentor endpoints
- `backend/app/services/report_engine.py` - Adapter for persisted daily reports
