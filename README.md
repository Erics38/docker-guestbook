# Docker Guestbook

A four-service Docker application: nginx frontend, Node.js/Express API, PostgreSQL database, and Grafana dashboard.

## Setup

```bash
cp .env.example .env
# Edit .env — set DB_PASSWORD and GRAFANA_PASSWORD
```

```bash
docker compose up -d --build
```

- Guestbook: http://localhost
- Grafana: http://localhost:3001

## Services

| Service  | Port | Description |
|----------|------|-------------|
| Frontend | 80   | nginx, serves HTML/CSS |
| Backend  | 3000 | Node.js REST API |
| Database | 5432 | PostgreSQL, localhost-only |
| Grafana  | 3001 | Metrics dashboard |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/guestbook` | All messages |
| POST | `/api/guestbook` | Add a message |
| GET | `/health` | Service status |
| GET | `/ready` | Readiness + DB check |
| GET | `/live` | Liveness + uptime |

POST body: `{ "name": "string", "message": "string" }`  
Rate limited to 20 requests per 15 minutes.

## Common Commands

```bash
# View logs
docker compose logs -f
docker compose logs -f backend

# Restart a service
docker compose restart backend

# Rebuild after code changes
docker compose up -d --build

# Stop everything
docker compose down

# Stop and wipe data
docker compose down -v
```

## Architecture

```
Browser
  ↓
nginx :80
  ├── static files (HTML/CSS)
  └── /api/* → backend :3000
                   ↓
             PostgreSQL :5432
```

## Troubleshooting

**Containers won't start**
- Confirm Docker Desktop is running
- Confirm `.env` exists with `DB_PASSWORD` and `GRAFANA_PASSWORD` set
- Check ports 80, 3000, 5432, 3001 are free

**Database errors**
```bash
docker compose down -v && docker compose up -d
```

**Grafana login fails**  
Credentials are in `.env` (`GRAFANA_USER`, `GRAFANA_PASSWORD`). If you changed them after first run, wipe the Grafana volume:
```bash
docker compose stop grafana
docker compose rm -f grafana
docker volume rm docker-hello-world_grafana_data
docker compose up -d grafana
```
