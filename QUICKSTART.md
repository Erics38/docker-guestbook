# Quickstart

## 1. Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

## 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and set two passwords:

```
DB_PASSWORD=something-secure
GRAFANA_PASSWORD=something-secure
```

## 3. Start

```bash
docker compose up -d --build
```

Four containers start: `guestbook-frontend`, `guestbook-backend`, `guestbook-db`, `guestbook-grafana`.

## 4. Open

| URL | Service |
|-----|---------|
| http://localhost | Guestbook app |
| http://localhost:3001 | Grafana (user: `admin`, password: your `GRAFANA_PASSWORD`) |

## 5. Stop

```bash
docker compose down        # stop, keep data
docker compose down -v     # stop, delete data
```

---

## Environment variables

All variables are in `.env`. See `.env.example` for the full list.

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_PASSWORD` | Yes | PostgreSQL password |
| `DB_USER` | No | PostgreSQL user (default: `postgres`) |
| `DB_NAME` | No | Database name (default: `guestbook`) |
| `GRAFANA_USER` | No | Grafana admin user (default: `admin`) |
| `GRAFANA_PASSWORD` | Yes | Grafana admin password |
| `CORS_ORIGIN` | No | Allowed CORS origin (default: `http://localhost`) |
