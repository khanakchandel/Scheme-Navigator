# SchemeNavigator Backend

Django REST Framework backend powering the SchemeNavigator multi-agent AI system.

---

## Quick Start (Docker)

```bash
# 1. Copy environment file
cp backend/.env.example backend/.env
# Edit backend/.env — set LITELLM_API_KEY and LITELLM_MODEL

# 2. Start PostgreSQL + Redis + backend
docker-compose up --build

# 3. Import scheme data (run once; re-run is idempotent)
docker-compose exec backend python manage.py import_schemes --source csv --file /path/to/schemes.csv
```

## Quick Start (Local / venv)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          
pip install -r requirements.txt

# Copy and edit .env
cp .env.example .env

# Start PostgreSQL and Redis (Docker or local install)
# Then:
python manage.py migrate
python manage.py import_schemes --source csv --file ../schemes_seed.csv
python manage.py runserver
```

## Connect Frontend
cd
In `Frontend-Scheme-Navigator-main/`:
```bash
cp .env.local.example .env.local
# .env.local already contains: VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

---

## Seed Data

Export the frontend's hardcoded TypeScript schemes to CSV first:

```bash
python scripts/export_frontend_schemes_to_csv.py
# Creates: schemes_seed.csv

python backend/manage.py import_schemes --source csv --file schemes_seed.csv
```

---

## Project Structure

```
backend/
├── config/                    # Django project config
│   ├── settings/
│   │   ├── base.py            # Shared settings
│   │   ├── dev.py             # Development overrides
│   │   └── prod.py            # Production overrides
│   ├── urls.py                # Root URL conf
│   ├── api_urls.py            # /api/* router
│   ├── health.py              # GET /api/health/
│   └── exceptions.py          # Custom DRF exception handler
│
├── schemes/                   # Scheme catalogue app
│   ├── models.py              # Scheme model (JSONB fields)
│   ├── serializers.py         # SchemeSerializer (camelCase output)
│   ├── views.py               # List + Detail views
│   ├── recommendation_views.py
│   ├── datasources/
│   │   ├── base.py            # DataSource ABC
│   │   ├── csv_source.py      # CSVDataSource
│   │   └── api_source.py      # ExternalAPIDataSource (stub)
│   └── management/commands/
│       └── import_schemes.py  # python manage.py import_schemes
│
├── sessions_app/              # Anonymous session management
│   ├── models.py              # Session (UUID token, profile JSONB)
│   ├── authentication.py      # SessionTokenAuthentication
│   ├── middleware.py          # UpdateLastActiveMiddleware
│   ├── schemas.py             # Pydantic UserProfileSchema
│   ├── profile_views.py       # GET/PUT /api/profile/
│   └── survey_views.py        # POST /api/survey/submit/, GET/PUT /api/survey/draft/
│
├── tracker/                   # Saved schemes + application tracker
│   ├── models.py              # SavedScheme, TrackerItem
│   ├── serializers.py
│   ├── saved_views.py         # GET/POST/DELETE /api/saved-schemes/
│   └── views.py               # GET/PUT /api/tracker/
│
├── assistant/                 # AI chat interface
│   ├── models.py              # ConversationMessage
│   ├── serializers.py
│   └── views.py               # GET /api/assistant/messages/, POST /api/assistant/chat/
│
├── agents/                    # Three AI agents
│   ├── litellm_client.py      # LiteLLM wrapper (swap providers via env)
│   ├── profile_agent.py       # Extracts UserProfile from natural language
│   ├── recommendation_agent.py# Scores + ranks schemes; LLM explanations
│   └── assistant_agent.py     # Chat orchestrator
│
└── docs/
    └── csv_schema.md          # CSV column documentation
```

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/sessions/` | None | Create anonymous session |
| `GET` | `/api/health/` | None | Health check |
| `GET` | `/api/schemes/` | Optional | List/filter/search schemes |
| `GET` | `/api/schemes/<id>/` | Optional | Single scheme by id or slug |
| `GET` | `/api/profile/` | Required | Get session profile |
| `PUT` | `/api/profile/` | Required | Update session profile |
| `POST` | `/api/survey/submit/` | Required | Submit survey → get recommendations |
| `GET` | `/api/survey/draft/` | Required | Get survey draft |
| `PUT` | `/api/survey/draft/` | Required | Save survey draft |
| `GET` | `/api/recommendations/` | Required | Get ranked recommendations |
| `POST` | `/api/recommendations/` | Required | Recompute with new profile |
| `GET` | `/api/saved-schemes/` | Required | List saved schemes |
| `POST` | `/api/saved-schemes/<id>/` | Required | Save a scheme |
| `DELETE` | `/api/saved-schemes/<id>/` | Required | Unsave a scheme |
| `GET` | `/api/tracker/` | Required | List tracker items |
| `PUT` | `/api/tracker/<id>/` | Required | Update tracker item |
| `GET` | `/api/assistant/messages/` | Required | Conversation history |
| `POST` | `/api/assistant/chat/` | Required | Send chat message |

**Authentication:** All protected endpoints require the header:
```
X-Session-Token: <uuid>
```

---

## Switching LLM Providers

Set `LITELLM_MODEL` in `.env` — no code changes needed:

```bash
# OpenAI
LITELLM_MODEL=gpt-4o-mini
LITELLM_API_KEY=sk-...

# Google Gemini
LITELLM_MODEL=gemini/gemini-1.5-flash
LITELLM_API_KEY=AIza...

# Anthropic
LITELLM_MODEL=anthropic/claude-3-haiku-20240307
LITELLM_API_KEY=sk-ant-...

# Local Ollama (no API key needed)
LITELLM_MODEL=ollama/llama3
```

---

## Adding a Future External API Source

1. Create `backend/schemes/datasources/my_api_source.py`:
   ```python
   from .base import DataSource
   import requests

   class MyGovAPISource(DataSource):
       def __init__(self, url, api_key):
           self.url = url
           self.api_key = api_key

       def fetch_schemes(self) -> list[dict]:
           resp = requests.get(self.url, headers={"Authorization": self.api_key})
           resp.raise_for_status()
           return [self._map(s) for s in resp.json()]

       def _map(self, raw: dict) -> dict:
           # Map API response fields → Scheme model fields
           return {"slug": raw["id"], "name": raw["title"], ...}
   ```

2. Register in `backend/schemes/datasources/__init__.py`:
   ```python
   from .my_api_source import MyGovAPISource
   _REGISTRY["myapi"] = MyGovAPISource
   ```

3. Run import:
   ```bash
   python manage.py import_schemes --source myapi --url https://api.data.gov.in/schemes
   ```

No rebuild required.
