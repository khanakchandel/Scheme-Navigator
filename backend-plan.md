# SchemeNavigator Backend — Detailed Plan

## Top-Level Overview

Build a **Django REST Framework** backend that replaces the frontend's `MockFrontendApiClient` with real
server-side logic. The backend hosts three LLM agents (via LiteLLM), serves the scheme catalogue from
PostgreSQL (seeded from CSV), caches hot data in Redis, and exposes a REST API that the frontend can
call by swapping a single environment variable (`VITE_API_BASE_URL`). A **pluggable DataSource interface**
means future live APIs can be wired in without rebuilding the backend.

No user authentication is required. Every session is identified by an **anonymous session token** issued
on first contact, stored in the browser's `localStorage` alongside profile and saved-scheme data.

---

## Architecture Diagram (text)

```
Browser (React)
     │  REST JSON (HTTPS)
     ▼
┌─────────────────────────────────────────────────────┐
│  Django REST Framework  (Gunicorn / Uvicorn)        │
│  ┌──────────┐  ┌────────────┐  ┌────────────────┐  │
│  │ /session │  │ /survey    │  │ /assistant     │  │
│  │ /schemes │  │ /recommend │  │ /tracker       │  │
│  └──────────┘  └─────┬──────┘  └───────┬────────┘  │
│                       │                 │            │
│          ┌────────────▼─────────────────▼──────┐   │
│          │         Agent Orchestrator           │   │
│          │  ┌─────────────┐  ┌──────────────┐  │   │
│          │  │ ProfileAgent│  │RecommendAgent│  │   │
│          │  └─────────────┘  └──────────────┘  │   │
│          │  ┌───────────────────────────────┐   │   │
│          │  │       AssistantAgent          │   │   │
│          │  └───────────────────────────────┘   │   │
│          │  All agents call ──▶ LiteLLM Router  │   │
│          └────────────────────────────────────-─┘   │
│                                                      │
│  ┌──────────────────┐   ┌────────────────────────┐  │
│  │   PostgreSQL DB  │   │   Redis Cache          │  │
│  │  schemes table   │   │  reco results / chat   │  │
│  │  sessions table  │   │  session metadata      │  │
│  │  tracker table   │   └────────────────────────┘  │
│  │  saved_schemes   │                               │
│  └──────────────────┘                               │
│                                                      │
│  DataSource Layer  (pluggable)                      │
│  ┌──────────────┐  ┌──────────────────────────────┐ │
│  │  CSVSource   │  │  ExternalAPISource (future)  │ │
│  └──────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Sub-Tasks

---

### Sub-Task 1 — Project Scaffolding & Configuration

**Status:** `[x] done`

**Intent**
Create the Django project skeleton with all dependencies, environment-variable driven settings, and
Docker-Compose for local development (PostgreSQL + Redis). This is the foundation every other sub-task
builds on.

**Expected Outcomes**
- `backend/` directory exists alongside the frontend folder
- `docker-compose.yml` spins up `postgres` and `redis` services
- `python manage.py runserver` starts without errors
- CORS headers allow requests from `http://localhost:5173`
- Health-check endpoint `GET /api/health/` returns `{"status": "ok"}`

**Todo List**
1. Create `backend/` directory; run `django-admin startproject config .` inside it
2. Add `requirements.txt`: `django`, `djangorestframework`, `django-cors-headers`, `psycopg2-binary`,
   `django-redis`, `python-dotenv`, `litellm`, `celery[redis]`, `pydantic`, `pandas`
3. Create `.env.example` with: `DATABASE_URL`, `REDIS_URL`, `LITELLM_API_KEY`, `LITELLM_MODEL`,
   `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`
4. Split `settings.py` into `settings/base.py`, `settings/dev.py`, `settings/prod.py`
5. Configure `DATABASES` via `dj-database-url`, `CACHES` via `django-redis`
6. Add `corsheaders` middleware; set `CORS_ALLOWED_ORIGINS` from env
7. Create `docker-compose.yml` with `db` (postgres:16) and `redis` (redis:7) services
8. Create `GET /api/health/` view that pings DB and Redis and returns status

**Relevant Context**
- No existing backend; this is greenfield
- Frontend dev server runs on port 5173 (Vite default)
- Frontend will read `VITE_API_BASE_URL` env var to point at this server

---

### Sub-Task 2 — Data Models (PostgreSQL)

**Status:** `[x] done`

**Intent**
Define all Django ORM models that back the API: Scheme (with nested JSON fields for eligibility,
benefits, documents, steps), Session (anonymous token), SavedScheme, TrackerItem, and
ConversationMessage (for chat history). These mirror the TypeScript interfaces exactly.

**Expected Outcomes**
- `python manage.py migrate` runs cleanly
- Django admin shows all models with sensible list displays
- All fields map 1-to-1 with the TypeScript interfaces in `src/types/index.ts`

**Todo List**
1. Create Django app `schemes`: `Scheme`, `EligibilityCriteria` (as JSONField on Scheme)
2. Create Django app `sessions_app`: `Session` model — `token` (UUID, primary key), `created_at`,
   `last_active`, `profile` (JSONField, nullable)
3. Create Django app `tracker`: `SavedScheme` (session FK + scheme FK), `TrackerItem`
   (session FK, scheme FK, status enum, notes, prepared_documents JSONField, timestamps)
4. Create Django app `assistant`: `ConversationMessage`
   (session FK, role enum `user|assistant`, content text, referenced_scheme_ids JSONField, created_at)
5. Write migrations for all apps
6. Register all models in Django admin with `list_display`, `search_fields`, `list_filter`
7. Add `__str__` and `Meta.ordering` to every model

**Relevant Context**
- `Scheme` TypeScript interface: `src/types/index.ts` lines 129-147
- `TrackerItem` TypeScript interface: `src/types/index.ts` lines 173-183
- `EligibilityCriteria` stored as PostgreSQL `jsonb` (Django `JSONField`) for flexibility
- Benefits, documents, applicationSteps stored as `JSONField` arrays on Scheme

---

### Sub-Task 3 — DataSource Layer & CSV Import

**Status:** `[x] done`

**Intent**
Implement a `DataSource` abstract base class with a `CSVDataSource` concrete implementation and a
stub `ExternalAPIDataSource` for future use. Wire a `import_schemes` management command that reads
the CSV, transforms rows into `Scheme` model instances, and upserts them. This design means adding a
future live-API source requires only writing a new `DataSource` subclass.

**Expected Outcomes**
- `python manage.py import_schemes --source csv --file schemes.csv` populates the `Scheme` table
- Re-running the command is idempotent (upserts by `slug`)
- `python manage.py import_schemes --source api --url <URL>` is recognised (stub, raises NotImplemented)
- `DataSource` ABC is in `schemes/datasources/base.py`; concrete classes in separate files

**Todo List**
1. Create `schemes/datasources/base.py` with abstract class `DataSource`:
   ```
   class DataSource(ABC):
       def fetch_schemes(self) -> list[dict]: ...
   ```
2. Create `schemes/datasources/csv_source.py` — `CSVDataSource(DataSource)`:
   - Reads CSV with `pandas`
   - Maps CSV column names → Scheme field names
   - Parses nested JSON columns (eligibility, benefits, etc.) if present as JSON strings,
     or constructs them from flat columns if CSV is flat
   - Returns list of dicts matching Scheme model structure
3. Create `schemes/datasources/api_source.py` — `ExternalAPIDataSource(DataSource)`:
   - Constructor accepts `url`, `api_key`, `headers`
   - `fetch_schemes()` raises `NotImplementedError` with a clear message (to be implemented later)
4. Create `schemes/datasources/__init__.py` that exports a `get_datasource(source_type, **kwargs)`
   factory function
5. Create management command `schemes/management/commands/import_schemes.py`:
   - Arguments: `--source` (csv | api), `--file` (path), `--url` (for API), `--dry-run`
   - Uses `get_datasource()` factory
   - Upserts via `Scheme.objects.update_or_create(slug=row['slug'], defaults={...})`
   - Prints summary: inserted / updated / skipped counts
6. Document expected CSV column schema in `backend/docs/csv_schema.md`

**Relevant Context**
- The frontend's 200+ schemes are all in `src/data/schemes.ts` and `src/data/moreSchemes.ts`
  — these can be exported to CSV as seed data
- The `ExternalAPIDataSource` stub ensures no future rebuild is needed; just implement the class

---

### Sub-Task 4 — Scheme Catalogue API Endpoints

**Status:** `[x] done`

**Intent**
Expose the scheme catalogue as REST endpoints that exactly match what the frontend's
`MockFrontendApiClient.getSchemes()` and `getScheme()` methods return, so the frontend can swap
the mock for real HTTP calls with minimal changes.

**Expected Outcomes**
- `GET /api/schemes/` returns paginated list with optional `?category=`, `?state=`, `?search=` filters
- `GET /api/schemes/<id-or-slug>/` returns a single scheme
- Response JSON shapes are identical to the TypeScript `Scheme` interface
- Redis caches `GET /api/schemes/` responses for 10 minutes (cache key includes filter params)

**Todo List**
1. Create `SchemeSerializer` (DRF `ModelSerializer`) that outputs all nested JSON fields correctly
2. Create `SchemeListView` (DRF `ListAPIView`):
   - Filter by `category`, `state` (checks `coveredStates` array contains value or 'All India'),
     `search` (name, tags, shortDescription)
   - Pagination: `page` + `limit` params; default limit 50
   - Cache response in Redis with key `schemes:list:<hash-of-params>`; TTL 10 min
3. Create `SchemeDetailView` (DRF `RetrieveAPIView`):
   - Look up by `id` OR `slug`
   - Cache per scheme in Redis
4. Wire URLs: `api/schemes/` → list; `api/schemes/<pk>/` → detail
5. Write basic DRF tests for list filtering and detail lookup

**Relevant Context**
- Frontend `getSchemes()` in `src/services/api.ts` lines 67-90
- Frontend `getScheme()` in `src/services/api.ts` lines 92-94
- Pagination envelope: `{ schemes: [...], pagination: { page, limit, total, totalPages } }`

---

### Sub-Task 5 — Session Management API

**Status:** `[x] done`

**Intent**
Issue and validate anonymous session tokens so the frontend can tie profile, saved schemes, and
tracker items to a device/session without requiring login.

**Expected Outcomes**
- `POST /api/sessions/` creates a new session, returns `{ token: "<uuid>" }`
- Any subsequent request with header `X-Session-Token: <uuid>` is validated; returns 401 if invalid
- DRF custom authentication class `SessionTokenAuthentication` resolves `request.user` to the
  `Session` object
- `last_active` is updated on every authenticated request

**Todo List**
1. Create `POST /api/sessions/` view — generates UUID, creates `Session` row, returns token
2. Create `SessionTokenAuthentication(BaseAuthentication)` in `sessions_app/authentication.py`:
   - Reads `X-Session-Token` header
   - Returns `(session, None)` if valid; `None` if header absent; raises `AuthenticationFailed` if
     token exists but is invalid/expired
3. Register `SessionTokenAuthentication` in `REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES']`
4. Middleware or signal to update `session.last_active` on each request
5. Add session expiry: sessions inactive for > 90 days are considered expired (return 401)
6. Write tests for token issuance and validation

**Relevant Context**
- Frontend stores token in `localStorage` under key `sn_session_token` (to be added in frontend
  integration step)
- All protected endpoints (profile, recommendations, tracker, chat) require the session token

---

### Sub-Task 6 — Profile & Survey API

**Status:** `[x] done`

**Intent**
Persist and retrieve the `UserProfile` JSON against the session. Mirror `getProfile()`,
`updateProfile()`, `submitSurvey()`, and draft-management methods.

**Expected Outcomes**
- `GET /api/profile/` returns the stored `UserProfile` JSON (or 404 if none)
- `PUT /api/profile/` replaces the profile; runs Pydantic validation
- `POST /api/survey/submit/` saves the profile and triggers recommendation pre-computation
- `GET/PUT /api/survey/draft/` reads and writes the in-progress survey answers

**Todo List**
1. Create `UserProfileSchema` Pydantic model matching `src/types/index.ts` `UserProfile` interface
   (all optional fields, same types)
2. Create `ProfileView` (GET + PUT) — stores profile as `session.profile` JSONField
3. Create `SurveySubmitView` (POST) — validates with Pydantic, saves profile, enqueues
   recommendation job via Celery (or computes synchronously if Celery not yet wired)
4. Create `SurveyDraftView` (GET + PUT) — stores draft as a separate `session.survey_draft`
   JSONField
5. Return the profile back in the same shape as the TypeScript interface
6. Write tests for profile CRUD

**Relevant Context**
- Frontend submits profile via `submitSurvey()` in `src/services/api.ts` lines 33-40
- Profile fields: `src/types/index.ts` lines 52-77
- After survey submit the frontend navigates to `/analyzing` then `/recommendations` — the
  recommendation response must be ready within ~3 seconds

---

### Sub-Task 7 — Three AI Agents

**Status:** `[x] done`

**Intent**
Implement the three LLM agents. All three use LiteLLM as the unified provider interface so any
model/provider can be swapped via environment variables.

#### Agent 1 — ProfileAgent
Parses a natural-language user description into a structured `UserProfile` JSON. Used by the
AssistantAgent when a user describes themselves in chat instead of filling the survey.

#### Agent 2 — RecommendationAgent
Takes a `UserProfile`, retrieves candidate schemes from PostgreSQL, scores them using the existing
weighted matching logic (ported from `matchingEngine.ts`), and uses the LLM to generate a
human-readable explanation for each top match. Returns ranked `SchemeMatchResult[]`.

#### Agent 3 — AssistantAgent
Powers the `/assistant` chat. Accepts conversation history + new user message, optionally calls
ProfileAgent to update profile from chat, retrieves relevant schemes via semantic/keyword search,
then generates a grounded, citation-rich response referencing real scheme data.

**Expected Outcomes**
- Each agent is a Python class in `agents/` with a single public async method
- All three agents call LiteLLM; model is read from `settings.LITELLM_MODEL`
- Agents are stateless; all context is passed as arguments
- `ProfileAgent.extract(text) -> UserProfile dict`
- `RecommendationAgent.recommend(profile) -> list[SchemeMatchResult dict]`
- `AssistantAgent.chat(history, message, session) -> { answer, referenced_scheme_ids }`

**Todo List**
1. Create `agents/` Django app (or plain Python package inside `backend/`)
2. Create `agents/litellm_client.py` — thin wrapper around `litellm.completion()` that reads
   `LITELLM_MODEL`, `LITELLM_API_KEY`, and default `temperature` from settings; handles retries
3. Create `agents/profile_agent.py` — `ProfileAgent` class:
   - System prompt instructs LLM to extract structured profile fields from free text
   - Returns JSON parsed against `UserProfileSchema` (Pydantic); falls back gracefully if partial
   - Tool/function calling schema matches `UserProfile` fields
4. Create `agents/recommendation_agent.py` — `RecommendationAgent` class:
   - Port the weighted scoring from `matchingEngine.ts` to Python (same weights: Age 20%, State 20%,
     Occupation 15%, Income 20%, Gender 10%, Category 15%)
   - Retrieve all schemes from DB (Redis-cached for 5 min)
   - Run scoring; take top 20 results
   - Call LLM once to generate `matchedReasons` and `unmatchedWarnings` strings for each top result
     (batch prompt to reduce latency)
   - Return `SchemeMatchResult` list
5. Create `agents/assistant_agent.py` — `AssistantAgent` class:
   - Build context window: system prompt + last 10 messages from conversation history
   - Detect if user is describing their situation → call `ProfileAgent.extract()` and update
     session profile
   - Retrieve top 5 relevant schemes via keyword + tag search from DB
   - Inject scheme summaries into system context
   - Call LLM; parse `referenced_scheme_ids` from response
   - Return answer + referenced scheme IDs
6. Write unit tests for each agent using mocked LiteLLM responses

**Relevant Context**
- Frontend `askAI()` in `src/services/api.ts` lines 120-140
- Chat message structure: `src/components/assistant/SchemeAdvisorChat.tsx`
- Matching weights: `src/services/matchingEngine.ts` (exact factor weights documented there)
- Suggested chat prompts in `src/constants/index.ts` — use as test inputs

---

### Sub-Task 8 — Recommendations API Endpoint

**Status:** `[x] done`

**Intent**
Expose the recommendation flow as a REST endpoint that calls `RecommendationAgent` and returns a
`SchemeMatchResult[]` response matching the frontend's expected shape.

**Expected Outcomes**
- `POST /api/recommendations/` accepts `{ profile }` body, returns ranked matches
- `GET /api/recommendations/` returns cached recommendations for the current session's stored profile
- Response JSON matches TypeScript `SchemeMatchResult[]` shape exactly
- Redis caches result per `(session_token, profile_hash)` for 30 minutes

**Todo List**
1. Create `recommendations/views.py`:
   - `POST` — validates profile with Pydantic, calls `RecommendationAgent.recommend()`, caches result
   - `GET` — reads session profile; returns cached result or recomputes
2. Serialise output to match: `{ scheme: Scheme, matchScore, matchGrade, matchedReasons,
   unmatchedWarnings, factors: MatchFactor[] }`
3. Wire URL: `api/recommendations/`
4. Add Redis caching with `profile_hash` (MD5 of sorted profile JSON) as part of cache key
5. Write integration test: submit profile → expect non-empty sorted results

**Relevant Context**
- Frontend calls `getRecommendations()` and `submitSurvey()` in `src/services/api.ts`
- `SchemeMatchResult` and `MatchFactor` types: `src/types/index.ts` lines 149-164

---

### Sub-Task 9 — Saved Schemes & Tracker API

**Status:** `[x] done`

**Intent**
Persist saved scheme bookmarks and application tracker items server-side so they survive browser
storage clears and can be retrieved on any device with the same session token.

**Expected Outcomes**
- `GET /api/saved-schemes/` returns list of full `Scheme` objects for the session
- `POST /api/saved-schemes/<scheme_id>/` saves a scheme; `DELETE` removes it
- `GET /api/tracker/` returns all `TrackerItem` objects for the session
- `PUT /api/tracker/<item_id>/` updates status, notes, documents

**Todo List**
1. Create `tracker/serializers.py` — `TrackerItemSerializer` matching TypeScript `TrackerItem`
2. Create `SavedSchemeView` (GET + POST + DELETE by scheme_id)
3. Create `TrackerListView` (GET) and `TrackerDetailView` (PUT/PATCH by item_id)
4. Auto-create a `TrackerItem` with status `Exploring` when a scheme is saved (mirrors frontend
   behaviour in `DashboardPage`)
5. Write CRUD tests for both resources

**Relevant Context**
- Frontend `getSavedSchemes()`, `saveScheme()`, `removeSavedScheme()` in `src/services/api.ts`
  lines 97-108
- Frontend `getApplications()`, `updateApplication()` in `src/services/api.ts` lines 111-117
- `TrackerItem` interface: `src/types/index.ts` lines 173-183

---

### Sub-Task 10 — Assistant Chat API Endpoint

**Status:** `[x] done`

**Intent**
Expose the `AssistantAgent` as a REST endpoint and persist conversation history per session so
the chat context survives page refreshes.

**Expected Outcomes**
- `GET /api/assistant/messages/` returns conversation history for the session (last 50 messages)
- `POST /api/assistant/chat/` accepts `{ message }`, calls `AssistantAgent.chat()`, persists both
  user message and assistant reply, returns `{ answer, referencedSchemes: Scheme[] }`
- Response shape matches what `MockFrontendApiClient.askAI()` currently returns

**Todo List**
1. Create `assistant/serializers.py` — `ConversationMessageSerializer`
2. Create `AssistantMessagesView` (GET) — returns last 50 messages for session
3. Create `AssistantChatView` (POST):
   - Persist user message
   - Load last 10 messages as history
   - Call `AssistantAgent.chat(history, message, session)`
   - Persist assistant reply with `referenced_scheme_ids`
   - Hydrate `referencedSchemes` by fetching Scheme objects from DB
   - Return `{ answer, referencedSchemes }`
4. Wire URLs: `api/assistant/messages/` and `api/assistant/chat/`
5. Write test: send a natural-language query → expect non-empty answer and at least one referenced scheme

**Relevant Context**
- Frontend chat component: `src/components/assistant/SchemeAdvisorChat.tsx`
- Mock `askAI()` return shape: `{ answer: string, referencedSchemes?: Scheme[] }`

---

### Sub-Task 11 — Frontend Integration (API Client Swap)

**Status:** `[x] done`

**Intent**
Replace the frontend's `MockFrontendApiClient` with a real HTTP client that calls the Django
backend. The swap must be backward-compatible: if `VITE_API_BASE_URL` is not set, the mock is used
as fallback (useful for offline demos).

**Expected Outcomes**
- `VITE_API_BASE_URL=http://localhost:8000` makes the frontend call the real backend
- Session token is created on first app load and stored in `localStorage` under `sn_session_token`
- All pages work end-to-end: survey → recommendations → detail → assistant → tracker
- If `VITE_API_BASE_URL` is unset, the existing mock client is used unchanged

**Todo List**
1. Create `Frontend-Scheme-Navigator-main/src/services/httpClient.ts` — `HttpApiClient` class
   implementing the same interface as `MockFrontendApiClient`:
   - Constructor reads `import.meta.env.VITE_API_BASE_URL`
   - Attaches `X-Session-Token` header to every request
   - On first call, if no token in `localStorage`, hits `POST /api/sessions/` to get one
2. Map each mock method to the corresponding real endpoint:
   - `getProfile()` → `GET /api/profile/`
   - `updateProfile()` → `PUT /api/profile/`
   - `submitSurvey()` → `POST /api/survey/submit/`
   - `getSurveyDraft()` → `GET /api/survey/draft/`
   - `saveSurveyDraft()` → `PUT /api/survey/draft/`
   - `getRecommendations()` → `GET /api/recommendations/`
   - `getSchemes()` → `GET /api/schemes/`
   - `getScheme()` → `GET /api/schemes/<id>/`
   - `getSavedSchemes()` → `GET /api/saved-schemes/`
   - `saveScheme()` → `POST /api/saved-schemes/<id>/`
   - `removeSavedScheme()` → `DELETE /api/saved-schemes/<id>/`
   - `getApplications()` → `GET /api/tracker/`
   - `updateApplication()` → `PUT /api/tracker/<id>/`
   - `askAI()` → `POST /api/assistant/chat/`
3. In `src/services/api.ts`, export `api` as `HttpApiClient` if env var is set, else `MockFrontendApiClient`
4. Add `.env.local.example` with `VITE_API_BASE_URL=http://localhost:8000`

**Relevant Context**
- Current mock: `Frontend-Scheme-Navigator-main/src/services/api.ts`
- All types already defined in `src/types/index.ts` — reuse them in `HttpApiClient`

---

### Sub-Task 12 — CSV Schema Documentation & Seed Data Export

**Status:** `[x] done`

**Intent**
Document the exact CSV column schema expected by `CSVDataSource` and provide a script to export the
frontend's hardcoded TypeScript scheme data to a CSV file that can be used as seed data immediately.

**Expected Outcomes**
- `backend/docs/csv_schema.md` documents every column with type, whether required, and example values
- `scripts/export_frontend_schemes_to_csv.py` reads the frontend TypeScript data files and writes
  `schemes_seed.csv` (can be run with Node or a simple regex-based extractor)
- `schemes_seed.csv` has all 200+ schemes in the correct format for `import_schemes` command

**Todo List**
1. Define CSV column schema based on `Scheme` and `EligibilityCriteria` interfaces:
   - Flat columns: `id`, `slug`, `name`, `tagline`, `category`, `level`, `short_description`,
     `detailed_description`, `popular_score`, `tags` (pipe-separated), `covered_states` (pipe-separated)
   - Eligibility columns: `elig_min_age`, `elig_max_age`, `elig_genders`, `elig_categories`,
     `elig_occupations`, `elig_max_income`, `elig_requires_disability`, `elig_requires_bpl`,
     `elig_area_types`
   - JSON-string columns (optional): `benefits_json`, `documents_json`, `application_steps_json`,
     `verification_json`
2. Write `backend/docs/csv_schema.md`
3. Write `scripts/export_frontend_schemes_to_csv.py` (Python script using `ast` / regex to parse
   the TypeScript object literals and output CSV)
4. Validate the export by running `import_schemes` against it in a test environment

**Relevant Context**
- Source data: `Frontend-Scheme-Navigator-main/src/data/schemes.ts` and `moreSchemes.ts`
- Import command defined in Sub-Task 3

---

## API Endpoint Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/sessions/` | None | Create anonymous session, get token |
| `GET` | `/api/health/` | None | Health check |
| `GET` | `/api/schemes/` | Optional | List/filter/search schemes |
| `GET` | `/api/schemes/<id>/` | Optional | Single scheme by id or slug |
| `GET` | `/api/profile/` | Required | Get session profile |
| `PUT` | `/api/profile/` | Required | Update session profile |
| `POST` | `/api/survey/submit/` | Required | Submit survey, get recommendations |
| `GET` | `/api/survey/draft/` | Required | Get survey draft |
| `PUT` | `/api/survey/draft/` | Required | Save survey draft |
| `GET` | `/api/recommendations/` | Required | Get ranked scheme recommendations |
| `POST` | `/api/recommendations/` | Required | Recompute with new profile |
| `GET` | `/api/saved-schemes/` | Required | List saved schemes |
| `POST` | `/api/saved-schemes/<id>/` | Required | Save a scheme |
| `DELETE` | `/api/saved-schemes/<id>/` | Required | Unsave a scheme |
| `GET` | `/api/tracker/` | Required | List tracker items |
| `PUT` | `/api/tracker/<id>/` | Required | Update tracker item |
| `GET` | `/api/assistant/messages/` | Required | Get conversation history |
| `POST` | `/api/assistant/chat/` | Required | Send message, get AI response |

---

## Technology Decisions

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Web framework | Django REST Framework | Batteries-included ORM, admin, auth |
| LLM routing | LiteLLM | Provider-agnostic; swap GPT-4 ↔ Gemini ↔ local with one env var |
| Database | PostgreSQL 16 | Robust JSON(B) support for eligibility/benefits fields |
| Cache | Redis 7 | Session data, recommendation cache, conversation context |
| Async tasks | Celery + Redis broker | Background recomputation if needed |
| Data validation | Pydantic v2 | Fast, strict schema validation for agent I/O |
| CSV import | pandas | Handles large CSVs, flexible column mapping |
| Pluggable sources | DataSource ABC | CSVSource now; ExternalAPISource without rebuild |
| Session auth | UUID token in header | Sessionless, no login required |

---

## Open Decisions (Resolved)

- **LLM provider**: LiteLLM router (any provider, swap via env)
- **Framework**: Django REST Framework
- **Database**: PostgreSQL + Redis
- **CSV strategy**: Management command `import_schemes`; pluggable `DataSource` ABC for future APIs
- **Three agents**: ProfileAgent, RecommendationAgent, AssistantAgent (confirmed)
- **Auth**: Anonymous session token (no login)
