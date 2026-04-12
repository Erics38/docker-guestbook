# Step-by-Step Guide to Run This Project

Here's how to start this project from scratch on your own:

## Prerequisites
- Docker Desktop installed and running
- Terminal/Command Prompt access

---

## Step 1: Start Docker Desktop
```bash
# Make sure Docker Desktop is running
docker ps
```
If you see an error, open Docker Desktop and wait until it's fully started.

---

## Step 2: Navigate to Project Directory
```bash
# Navigate to the project directory
cd path/to/docker-hello-world
```

---

## Step 3: Start All Services
```bash
# Build and start all containers in detached mode
docker-compose up -d --build
```

**What this does:**
- Builds the frontend (nginx) image
- Builds the backend (Node.js) image
- Pulls PostgreSQL image
- Creates network for containers to communicate
- Starts all 3 containers

**Expected output:**
```
Container guestbook-db         Started
Container guestbook-backend    Started
Container guestbook-frontend   Started
```

---

## Step 4: Wait for Services to Initialize
```bash
# Wait ~10 seconds for database to initialize
# Then check container status
docker-compose ps
```

You should see all 3 containers with status "Up".

---

## Step 5: Access the Application
Open your browser to: **http://localhost**

---

## Common Commands

**View logs (all services):**
```bash
docker-compose logs -f
```

**View logs (specific service):**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

**Stop all services:**
```bash
docker-compose down
```

**Stop and remove volumes (fresh start):**
```bash
docker-compose down -v
```

**Restart a specific service:**
```bash
docker-compose restart backend
```

**Rebuild after code changes:**
```bash
docker-compose up -d --build
```

**Check running containers:**
```bash
docker ps
```

---

## Troubleshooting

**Problem: Database version mismatch**
```bash
# Solution: Remove volumes and restart
docker-compose down -v
docker-compose up -d
```

**Problem: Port already in use**
```bash
# Check what's using port 80 or 3000
docker ps
# Stop conflicting containers or change ports in docker-compose.yml
```

**Problem: Changes not showing**
```bash
# Rebuild containers
docker-compose up -d --build
```

---

## Quick Reference: Project Structure

```
docker-hello-world/
├── docker-compose.yml       <- Orchestrates all services
├── Dockerfile              <- Frontend (nginx) container
├── Dockerfile.backend      <- Backend (Node.js) container
├── nginx.conf              <- Nginx proxy configuration
├── index.html              <- Frontend HTML
├── style.css               <- Frontend styles
└── backend/
    ├── package.json        <- Node.js dependencies
    └── server.js           <- Backend API code
```

---

## The Complete Workflow (Summary)

```bash
# 1. Navigate to project
cd docker-hello-world

# 2. Start everything
docker-compose up -d --build

# 3. Open browser
# Visit http://localhost

# 4. When done, stop everything
docker-compose down
```

---

## Services & Ports

| Service | Container Name | Port | Purpose |
|---------|---------------|------|---------|
| Frontend | guestbook-frontend | 80 | Nginx web server serving HTML/CSS |
| Backend | guestbook-backend | 3000 | Node.js/Express API |
| Database | guestbook-db | 5432 | PostgreSQL database |

---

## API Endpoints

- `GET /api/guestbook` - Retrieve all messages
- `POST /api/guestbook` - Add a new message
- `GET /health` - Backend health check
- `GET /ready` - Backend readiness check (includes DB status)
- `GET /live` - Backend liveness check

---

## Architecture

```
Browser (http://localhost)
    ↓
nginx (port 80) - Serves static files
    ↓ (proxy /api/*)
Backend API (port 3000) - Node.js/Express
    ↓
PostgreSQL Database (port 5432) - Data storage
```

---

That's it! Just 4 steps to get the entire application running.
