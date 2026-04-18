# TaskFlow

A task management system with user authentication, project organization, and task tracking. Built with Go, React, PostgreSQL, and Docker.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Go 1.23, Chi router, pgx v5, golang-migrate |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query |
| Database | PostgreSQL 16 |
| Auth | JWT (HS256, 24h expiry), bcrypt (cost 12) |
| Infra | Docker Compose, multi-stage builds, nginx |

## Architecture Decisions

**Backend structure** — Clean layered architecture: handlers → services → repositories. No ORM; raw SQL via pgx for full control over queries and performance. Repositories return domain models, services enforce business rules, handlers deal with HTTP concerns only.

**Why Chi over Gin/Echo** — Chi is lightweight, idiomatic (uses stdlib `net/http`), and has excellent middleware composability. No magic, easy to test.

**Why pgx over GORM** — Direct SQL gives explicit control over queries, avoids N+1 surprises, and makes it straightforward to write performant JOINs. The tradeoff is more boilerplate for CRUD operations, but for this scope it's manageable.

**Embedded migrations** — Migrations are embedded in the Go binary via `embed.FS` and run automatically on server startup. This eliminates the need for a separate migration step in Docker and ensures the schema is always in sync with the binary version.

**Frontend state management** — TanStack Query handles server state (caching, invalidation, optimistic updates). Auth state lives in React Context with localStorage persistence. No Redux needed at this scale.

**shadcn/ui approach** — Components are co-located in the project (not a node_modules dependency), giving full control over styling and behavior. Uses Tailwind CSS + class-variance-authority for variant-based component APIs.

**Nginx reverse proxy** — In production (Docker), nginx serves the SPA and proxies `/api/` requests to the backend. This keeps the frontend and backend on the same origin, avoiding CORS complexity in production. CORS is still configured for local development where Vite runs on a separate port.

**What I intentionally left out** — Rate limiting, refresh tokens, WebSocket real-time updates, email verification, and role-based access control beyond owner checks. These are important for production but outside the scope of this assignment.

## Running Locally

Prerequisites: Docker and Docker Compose.

```bash
git clone https://github.com/your-name/taskflow
cd taskflow
cp .env.example .env
docker compose up --build
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **PostgreSQL**: localhost:5432

First startup takes a few minutes to build the Docker images. Subsequent starts are fast due to layer caching.

## Running Migrations

Migrations run automatically on backend startup — no manual steps needed. The Go binary embeds the migration files and applies them before starting the HTTP server.

To run migrations manually (if needed):

```bash
# Install golang-migrate CLI
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# Run migrations
migrate -path backend/migrations -database "postgres://taskflow:taskflow@localhost:5432/taskflow?sslmode=disable" up

# Rollback
migrate -path backend/migrations -database "postgres://taskflow:taskflow@localhost:5432/taskflow?sslmode=disable" down
```

## Test Credentials

The database is seeded automatically on first startup (when `SEED_DB=true` in `.env`):

| Field | Value |
|-------|-------|
| Email | `test@example.com` |
| Password | `password123` |

Seed data includes 1 user, 1 project ("Website Redesign"), and 3 tasks with different statuses.

## API Reference

Base URL: `http://localhost:8080`

### Authentication

#### POST /auth/register

```json
// Request
{ "name": "Jane Doe", "email": "jane@example.com", "password": "secret123" }

// Response 201
{
  "token": "<jwt>",
  "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com" }
}
```

#### POST /auth/login

```json
// Request
{ "email": "test@example.com", "password": "password123" }

// Response 200
{
  "token": "<jwt>",
  "user": { "id": "uuid", "name": "Test User", "email": "test@example.com" }
}
```

### Projects (requires `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /projects?page=1&limit=20 | List projects the user owns or has tasks in |
| POST | /projects | Create a project |
| GET | /projects/:id | Get project details with tasks |
| PATCH | /projects/:id | Update name/description (owner only) |
| DELETE | /projects/:id | Delete project and tasks (owner only) |
| GET | /projects/:id/stats | Task counts by status and assignee |

#### POST /projects

```json
// Request
{ "name": "New Project", "description": "Optional description" }

// Response 201
{ "id": "uuid", "name": "New Project", "description": "Optional description", "owner_id": "uuid", "created_at": "..." }
```

#### GET /projects/:id

```json
// Response 200
{
  "id": "uuid",
  "name": "Website Redesign",
  "description": "Q2 redesign project",
  "owner_id": "uuid",
  "created_at": "...",
  "tasks": [
    {
      "id": "uuid",
      "title": "Design homepage",
      "status": "in_progress",
      "priority": "high",
      "assignee_id": "uuid",
      "due_date": "2026-04-20",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

#### GET /projects/:id/stats

```json
// Response 200
{
  "by_status": { "todo": 1, "in_progress": 1, "done": 1 },
  "by_assignee": [
    { "assignee_id": "uuid", "assignee_name": "Test User", "count": 2 }
  ]
}
```

### Tasks (requires `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /projects/:id/tasks?status=todo&assignee=uuid | List tasks with optional filters |
| POST | /projects/:id/tasks | Create a task |
| PATCH | /tasks/:id | Update task fields |
| DELETE | /tasks/:id | Delete task (project owner or task creator) |

#### POST /projects/:id/tasks

```json
// Request
{
  "title": "New task",
  "description": "Details",
  "priority": "high",
  "assignee_id": "uuid",
  "due_date": "2026-05-01"
}

// Response 201
{
  "id": "uuid",
  "title": "New task",
  "status": "todo",
  "priority": "high",
  "project_id": "uuid",
  "assignee_id": "uuid",
  "due_date": "2026-05-01",
  "created_at": "...",
  "updated_at": "..."
}
```

#### PATCH /tasks/:id

```json
// Request (all fields optional)
{ "title": "Updated", "status": "done", "priority": "low", "assignee_id": "uuid", "due_date": "2026-05-15" }

// Response 200 — returns updated task
```

### Error Responses

```json
// 400 Validation error
{ "error": "validation failed", "fields": { "email": "is required" } }

// 401 Unauthenticated
{ "error": "unauthorized" }

// 403 Forbidden
{ "error": "forbidden" }

// 404 Not found
{ "error": "not found" }
```

## What I'd Do With More Time

**Refresh tokens** — The current JWT-only approach means users get logged out after 24 hours with no graceful renewal. A refresh token rotation scheme would improve UX significantly.

**Rate limiting** — No rate limiting on auth endpoints currently. In production, I'd add sliding window rate limits per IP on login/register to prevent brute-force attacks.

**Real-time updates** — WebSocket or SSE for live task updates when multiple users are in the same project. Currently, TanStack Query's stale time and window refocus handle staleness, but true real-time would be better for collaboration.

**Comprehensive test suite** — Integration tests covering the full auth flow, project CRUD, task permissions, and edge cases. The current implementation has integration tests for core auth flows; a production system needs significantly more coverage.

**Input sanitization** — While SQL injection is prevented by parameterized queries, I'd add stricter input validation and potentially HTML sanitization for description fields.

**Pagination on tasks** — Projects endpoint supports pagination, but task lists within a project don't. For projects with many tasks, this would be needed.

**Drag-and-drop** — The kanban-style board layout is ready for drag-and-drop reordering. I'd add this with `@dnd-kit/core` for accessible, performant drag interactions.

**CI/CD** — GitHub Actions pipeline for linting, testing, building Docker images, and deploying. Currently there's no CI configuration.

**Observability** — Structured logging is in place, but I'd add OpenTelemetry tracing, Prometheus metrics, and health check endpoints with dependency status (DB connectivity, etc.).
