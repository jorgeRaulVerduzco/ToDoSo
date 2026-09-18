# toDoSo Backend

A Django + Django REST Framework backend for the **toDoSo** productivity app.

## What this project does

- **Task management** — full CRUD with status/priority filters.
- **Focus sessions** — start/stop timed concentration sessions with business rules (one active session per user).
- **Block list** — per-user list of domains to block (the actual blocking is done client-side; this is the source of truth).
- **Real-time notifications** — WebSocket channel (Django Channels + Redis) that broadcasts `session_started` / `session_stopped` events to all connected clients for a user, eliminating the need for polling.

---

## Architecture

```
HTTP Request
    │
    ▼
[interfaces/views.py]        ← DRF views: validate input, call use case, serialize output
    │  calls
    ▼
[application/use_cases/]     ← one class = one use case; depends only on domain interfaces
    │  calls
    ├──► [domain/repositories.py]  (Protocol interface)
    │         ▲ implemented by
    │    [infrastructure/repositories.py]  (Django ORM)
    │
    └──► [application/events.py]   (Protocol interface)
              ▲ implemented by
         [infrastructure/channel_event_publisher.py]
                   │ calls group_send
                   ▼
         [infrastructure/consumers.py]   (Channels WebSocket)
                   │ forwards JSON to
                   ▼
         Connected WebSocket clients (desktop app / browser extension)
```

### Layer responsibilities

| Layer | Package | Rule |
|---|---|---|
| **Domain** | `apps/core/domain/` | Zero Django imports. Pure Python dataclasses + Protocol interfaces. |
| **Application** | `apps/core/application/` | Orchestrates use cases. Depends on domain interfaces only. |
| **Infrastructure** | `apps/core/infrastructure/` | Django ORM models, concrete repos, Channels consumer. |
| **Interfaces** | `apps/core/interfaces/` | DRF serializers + views + DI wiring. HTTP-only, no business logic. |

---

## Stack

| Concern | Technology |
|---|---|
| Framework | Django 5.1, Django REST Framework 3.15 |
| Async / WS | Django Channels 4.1, Daphne 4.1 |
| DB | PostgreSQL 16 |
| Cache / Channels | Redis 7 |
| Auth | djangorestframework-simplejwt |
| API docs | drf-spectacular (OpenAPI 3.1 / Swagger UI) |
| Tests | pytest, pytest-django, pytest-asyncio |
| Linting | ruff, black |

---

## Quick start (Docker)

```bash
# 1. Clone and enter the project
git clone <repo-url>
cd todoso_backend

# 2. Create your .env file
cp .env.example .env
# Edit .env and set SECRET_KEY to a random 50+ char string

# 3. Start all services
docker compose up --build

# 4. Server is at http://localhost:8000
# Swagger UI:  http://localhost:8000/api/docs/
# ReDoc:       http://localhost:8000/api/redoc/
```

The `web` container automatically runs migrations and loads seed fixtures on startup.

---

## Local development (without Docker)

### Prerequisites

- Python 3.12+
- PostgreSQL 16 running locally
- Redis 7 running locally

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: set DB_HOST=localhost, REDIS_URL=redis://localhost:6379/0

# Apply migrations
python manage.py migrate

# Load seed data (optional)
python manage.py loaddata tests/fixtures/initial_data.json

# Start ASGI server
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `DJANGO_SETTINGS_MODULE` | `config.settings.development` | Settings module to use |
| `SECRET_KEY` | *(required)* | Django secret key (50+ random chars) |
| `DEBUG` | `False` | Enable Django debug mode |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated allowed hosts |
| `DB_NAME` | `todoso` | PostgreSQL database name |
| `DB_USER` | `todoso` | PostgreSQL user |
| `DB_PASSWORD` | `todoso` | PostgreSQL password |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis URL (for Channels) |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | `60` | JWT access token lifetime |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | `7` | JWT refresh token lifetime |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins |

---

## API reference

Interactive docs at `/api/docs/` (Swagger UI) once the server is running.

### Auth

```
POST /api/auth/login/     { "username": "...", "password": "..." }
POST /api/auth/refresh/   { "refresh": "<token>" }
```

All other endpoints require `Authorization: Bearer <access_token>`.

### Tasks

```
GET    /api/tasks/?status=pending&priority=high
POST   /api/tasks/
PATCH  /api/tasks/{id}/
DELETE /api/tasks/{id}/
```

### Blocked Sites

```
GET    /api/blocked-sites/?active_only=true
POST   /api/blocked-sites/
PATCH  /api/blocked-sites/{id}/    { "is_active": false }
DELETE /api/blocked-sites/{id}/
```

### Focus Sessions

```
POST   /api/focus-sessions/start/            { "planned_duration_minutes": 25, "task_id": 1 }
POST   /api/focus-sessions/{id}/stop/
GET    /api/focus-sessions/active/           ← REST snapshot for initial client load
GET    /api/focus-sessions/history/?status=finished
GET    /api/focus-sessions/stats/
```

### WebSocket

```
WS  ws://localhost:8000/ws/focus-sessions/?token=<access_jwt>
```

**Connection flow:**
1. Connect with the JWT access token as a query parameter.
2. On connect, receive `{"type": "connected", "user_id": <id>}`.
3. Call `GET /api/focus-sessions/active/` to get the current state.
4. From this point, receive events in real time:
   - `{"type": "session_started", "session_id": ..., "blocked_domains": [...], ...}`
   - `{"type": "session_stopped", "session_id": ..., "ended_at": "...", ...}`

**User isolation:** Each user is in their own Channels group (`focus_<user_id>`). A user never receives events for another user's sessions.

---

## Running tests

```bash
# Unit tests only (no DB, no Redis required)
pytest tests/unit/ -v

# All tests (requires Postgres + in-memory channels layer from testing.py)
pytest -v

# With coverage report
pytest --cov=apps --cov-report=term-missing

# Run a single test file
pytest tests/integration/test_task_api.py -v
```

Test categories (defined in `pytest.ini`):
- `@pytest.mark.unit` — pure Python, no DB
- `@pytest.mark.django_db` — requires test database

---

## SOLID principles applied

| Principle | Where |
|---|---|
| **SRP** | Each use case file (e.g., `create_task.py`) does exactly one thing |
| **OCP** | New use cases can be added without modifying existing ones |
| **LSP** | Any object satisfying a repository Protocol can replace the Django ORM impl |
| **ISP** | `TaskReader` and `TaskWriter` are separate Protocols; composed into `TaskRepository` |
| **DIP** | Application layer imports `domain.repositories.TaskRepository` (Protocol), never `DjangoTaskRepository` |

---

## Project structure

```
todoso_backend/
├── config/
│   ├── settings/
│   │   ├── base.py           # shared settings
│   │   ├── development.py    # dev overrides
│   │   └── testing.py        # test overrides (in-memory channels)
│   ├── asgi.py               # ASGI entry point (HTTP + WS)
│   ├── routing.py            # WebSocket URL patterns
│   └── urls.py               # Root URL conf
├── apps/
│   └── core/
│       ├── domain/           # Pure Python: entities, value objects, repo interfaces
│       ├── application/      # Use cases (14 total) + event publisher protocol
│       ├── infrastructure/   # Django ORM models, repos, Channels consumer, WS middleware
│       └── interfaces/       # DRF views, serializers, DI wiring, error handler
├── tests/
│   ├── unit/                 # No DB (domain + application layer)
│   ├── integration/          # DB + Channels (API + WebSocket)
│   └── fixtures/             # Seed data
├── docker-compose.yml
├── Dockerfile
├── manage.py
├── pytest.ini
└── requirements.txt
```
