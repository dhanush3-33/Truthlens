# TruthLens AI — AI Fake News & Claim Analyzer

TruthLens AI is a full-stack web application that helps users investigate news headlines,
short claims, and article text. It uses **Google Gemini** for structured claim analysis and
evidence comparison, plus a **configurable search API** to retrieve real external sources.

> **Honesty first:** Verdicts are AI-assisted interpretations of retrieved evidence — not
> absolute truth. The app never fabricates sources, URLs, or citations. When evidence
> retrieval or AI analysis fails, the failure is disclosed in the UI. Absence of evidence
> is never treated as proof that a claim is false.

---

## Architecture

```
truthlens-ai/
├── frontend/                 # React 19 + Vite + Tailwind CSS v4 + Lucide icons
│   └── src/
│       ├── components/       # ClaimInput, VerdictPanel, EvidencePanel, …
│       ├── pages/            # Home (analyzer + results dashboard)
│       ├── services/         # api.js — thin fetch client for the backend
│       └── utils/            # report.js — copy/download text reports
└── backend/                  # Flask REST API
    ├── app.py                # /api/analyze, /api/health, validation, orchestration
    └── services/
        ├── ai_analyzer.py    # Gemini REST integration (2-phase structured JSON)
        └── evidence_search.py# Pluggable search providers + fallback chain
```

### Analysis pipeline (`POST /api/analyze`)

1. **Validate input** — non-empty, max length (default 8,000 chars), server-side.
2. **AI claim analysis (Gemini)** — extracts the central claim, entities (people,
   organizations, locations, dates, numbers), sensational language, a verification plan,
   and focused search queries. Structured JSON with strict parsing and error handling.
3. **Evidence retrieval** — runs the search queries against the configured provider chain
   and returns real source titles, URLs, dates, and short summaries.
4. **Evidence comparison (Gemini)** — weighs retrieved evidence against the claim and
   classifies a verdict: **Supported · Contradicted · Misleading · Unverified**.
   Forced to **Unverified** when no evidence was retrieved.
5. **Response** — verdict, explanation, supporting/contradicting points, missing context,
   limitations, sources, and full search-status metadata.

Retrieved content is treated as **untrusted data**. Prompts instruct the model to ignore
any instructions embedded in search results; snippets are HTML-stripped, length-capped,
and only real URLs are kept.

---

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- A **Gemini API key** — get one at [Google AI Studio](https://aistudio.google.com/apikey)
- Optional: a search API key (Tavily, Brave, or SerpApi). Without one, the app falls back
  to keyless providers (Wikipedia's public API, then DuckDuckGo HTML) — less reliable and
  clearly labeled in the UI.

---

## Setup

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env      # Windows  (macOS/Linux: cp .env.example .env)
```

Edit `backend/.env` and set at least:

```env
GEMINI_API_KEY=your_real_key_here
```

Run:

```bash
python app.py               # serves http://127.0.0.1:5001
```

### 2. Frontend

```bash
cd frontend
npm install
copy .env.example .env      # optional — defaults to http://127.0.0.1:5001
npm run dev                 # serves http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Deployment (Netlify + Render)

Netlify cannot host Python, so the app deploys as two free services:

| Service | What | Config file |
|---|---|---|
| **Render** | Flask backend | `render.yaml` (Blueprint) |
| **Netlify** | React frontend | `frontend/netlify.toml` |

### Step 1 — Deploy the backend on Render

1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) → **New → Blueprint** → select your repo.
   Render detects `render.yaml` and creates the service automatically.
   (Or **New → Web Service** manually: root `backend`, build `pip install -r requirements.txt`,
   start `python app.py`.)
3. In the service **Environment** tab, set:
   - `GEMINI_API_KEY` = your real key
   - `ALLOWED_ORIGINS` = `https://your-site.netlify.app,http://localhost:5173`
4. Note the service URL, e.g. `https://truthlens-ai-backend.onrender.com`.
   Health check: `https://truthlens-ai-backend.onrender.com/api/health`

> Render free services spin down after inactivity — the first request after idle can take ~30s.

### Step 2 — Deploy the frontend on Netlify

1. Go to [netlify.com](https://netlify.com) → **Add new site → Import an existing project** → GitHub → this repo.
2. Netlify auto-detects `frontend/netlify.toml` (base `frontend`, build `npm run build`, publish `dist`).
3. Before deploying, add the env var under **Site settings → Environment variables**:
   - `VITE_API_BASE_URL` = `https://truthlens-ai-backend.onrender.com` (your Render URL)
4. Deploy. Then copy the Netlify URL (e.g. `https://your-site.netlify.app`) back into
   Render's `ALLOWED_ORIGINS` and redeploy the backend so CORS accepts it.

### Step 3 — Verify

- `https://<backend>.onrender.com/api/health` → JSON with `"status": "ok"`
- `https://<site>.netlify.app` → the app loads; run a sample claim end-to-end

**Notes**
- Never put `GEMINI_API_KEY` in Netlify env vars — the frontend never needs it; keys stay backend-only.
- `DEMO_MODE=true` (default in `render.yaml`) means the site works even before you paste the
  Gemini key, clearly labeled as DEMO until the key is set.
- Local Windows shortcut: double-click `start-dev.bat` to run both servers locally.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `GEMINI_API_KEY` | **Yes** (for real analysis) | — | Gemini API key. Never commit the real key. |
| `GEMINI_MODEL` | No | `gemini-3.5-flash` | Gemini model id. |
| `EVIDENCE_PROVIDER` | No | `auto` | `auto` \| `tavily` \| `brave` \| `serpapi` \| `wikipedia` \| `duckduckgo` \| `none`. |
| `TAVILY_API_KEY` | No | — | Enables Tavily in `auto` mode. |
| `BRAVE_API_KEY` | No | — | Enables Brave Search in `auto` mode. |
| `SERPAPI_API_KEY` | No | — | Enables SerpApi in `auto` mode. |
| `PORT` | No | `5001` | Flask port. |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173,…` | CORS allow-list (comma-separated). |
| `AI_TIMEOUT_SECONDS` | No | `45` | Gemini request timeout. |
| `SEARCH_TIMEOUT_SECONDS` | No | `15` | Search request timeout. |
| `MAX_INPUT_CHARS` | No | `8000` | Server-side input limit. |
| `DEMO_MODE` | No | `true` | When `true` **and** no Gemini key is set, returns a clearly labeled DEMO analysis (local heuristics only; verdict always `Unverified`). It never pretends to be real AI. |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `VITE_API_BASE_URL` | No | `http://127.0.0.1:5001` | Backend base URL. **Never put API keys here** — keys stay on the backend. |

---

## API

### `GET /api/health`

```json
{ "status": "ok", "ai_configured": true, "demo_mode": false,
  "evidence_provider": "tavily", "max_input_chars": 8000 }
```

### `POST /api/analyze`

Body: `{ "text": "claim, headline, or article text" }`

Returns (shape abbreviated):

```json
{
  "ok": true,
  "mode": "live",
  "analysis": {
    "central_claim": "…",
    "claim_type": "…",
    "entities": { "people": [], "organizations": [], "locations": [], "dates": [], "numbers": [] },
    "sensational_language": [{ "phrase": "…", "why": "…" }],
    "verification_plan": ["…"],
    "search_queries": ["…"]
  },
  "evidence": {
    "search": { "status": "ok|failed|unavailable", "detail": "…", "errors": [] },
    "sources": [{ "title": "…", "url": "https://…", "published_date": "…", "summary": "…", "provider": "…" }]
  },
  "verdict": {
    "verdict": "Supported|Contradicted|Misleading|Unverified",
    "explanation": "…",
    "supporting_points": [], "contradicting_points": [],
    "missing_context": [], "limitations": []
  },
  "disclaimer": "…"
}
```

Error responses use `{ "ok": false, "error": { "code": "…", "message": "…" } }` with
proper HTTP status codes (`400` validation, `502` upstream AI failure).

---

## Features

- **Claim input** — headlines, short claims, or article text; char counter, empty/length
  validation, and one-click sample claims.
- **AI analysis** — central claim extraction, entity/date/number identification,
  sensational-language detection, and a verification plan.
- **Evidence search** — provider chain with keyed APIs preferred, keyless fallbacks last;
  every failure disclosed with source-quality caveats (e.g., Wikipedia is encyclopedic
  context, not a fact-check).
- **Verdicts** — Supported / Contradicted / Misleading / Unverified, generated only after
  reviewing evidence; defaults to Unverified when evidence is insufficient.
- **Results dashboard** — verdict badge, explanation, supporting & contradicting evidence,
  clickable sources, missing context, limitations. No invented probabilities or confidence
  percentages.
- **Responsive, accessible UI** — deep-navy theme, blue/violet accents, mobile → desktop
  layouts, loading/error states, `prefers-reduced-motion` support.
- **Optional extras** — analysis history (browser localStorage only), copy report,
  download text report.

---

## Testing (performed during development)

| Scenario | Expected | Result |
|---|---|---|
| Empty input | 400 `empty_input` | ✅ |
| Input > 8,000 chars | 400 `too_long` | ✅ |
| Valid claim, demo mode | Analysis + honest Unverified verdict | ✅ |
| Real evidence retrieval (Wikipedia fallback) | Real titles/URLs, status `ok` | ✅ |
| Search provider failure (DDG blocked) | Status `failed`, error disclosed | ✅ |
| Search disabled (`EVIDENCE_PROVIDER=none`) | Status `unavailable`, disclosed | ✅ |
| Invalid Gemini API key | 502 `ai_failure` with provider message | ✅ |
| Missing Gemini key | DEMO MODE banner, never pretends to be AI | ✅ |
| No relevant evidence | Verdict forced to `Unverified` | ✅ (code path) |
| Production build | `npm run build` succeeds | ✅ |

**Remaining limitations (honest):**
- Full live Gemini verdicts (Supported/Contradicted/Misleading) require your own
  `GEMINI_API_KEY`; they could not be exercised here without one.
- Mobile responsiveness is implemented via Tailwind breakpoints but was not visually
  verified on physical devices in this environment.
- The keyless DuckDuckGo fallback is inherently fragile (bot challenges); configure a
  keyed provider (Tavily/Brave/SerpApi) for reliable evidence retrieval.
- Wikipedia fallback gives encyclopedic context, not real-time news fact-checks — the UI
  labels this caveat explicitly.

---

## Security notes

- All API keys live on the **backend**, read from environment variables; `.env` is
  git-ignored and `.env.example` contains placeholders only.
- CORS is restricted to configured origins.
- Request timeouts on all external calls; rate-limit and provider failures are handled
  and surfaced.
- Retrieved content is sanitized (HTML stripped, length-capped, URLs validated) and is
  never executed or trusted as instructions.

## License

MIT — use and adapt freely.
