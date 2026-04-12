# Docker Guestbook Application

A full-stack guestbook application running entirely in Docker containers, perfect for learning containerization and multi-service orchestration.

## What This Project Does

This is a **local Docker application** with three connected services:
- **Frontend** (nginx) - Serves the web interface
- **Backend** (Node.js/Express) - REST API with AWS SQS integration
- **Database** (PostgreSQL) - Persistent data storage

Users can sign a guestbook through a web form, and messages are stored in a PostgreSQL database.

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Terminal/Command Prompt

### Run the Application

```bash
# Navigate to project directory
cd docker-hello-world

# Start all services
docker-compose up -d --build

# Open your browser to http://localhost
```

That's it! The application is now running.

## Project Structure

```
docker-hello-world/
├── docker-compose.yml       # Orchestrates all services
├── Dockerfile              # Frontend container (nginx)
├── Dockerfile.backend      # Backend container (Node.js)
├── nginx.conf              # Nginx proxy configuration
├── index.html              # Frontend HTML
├── style.css               # Frontend styles
├── backend/
│   ├── package.json        # Node.js dependencies
│   └── server.js           # API server with SQS integration
├── QUICKSTART.md           # Detailed startup guide
└── README.md               # This file
```

## Common Commands

```bash
# Start all services
docker-compose up -d

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v

# Restart a service
docker-compose restart backend

# Rebuild after code changes
docker-compose up -d --build
```

## Services & Ports

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| Frontend | guestbook-frontend | 80 | Web interface |
| Backend | guestbook-backend | 3000 | REST API |
| Database | guestbook-db | 5432 | PostgreSQL |

## API Endpoints

- `GET /api/guestbook` - Retrieve all messages
- `POST /api/guestbook` - Add a new message
- `GET /health` - Backend health check
- `GET /ready` - Readiness check (includes DB status)
- `GET /live` - Liveness check

## Future Features

### AWS Integration (Coming Soon)
The backend already includes AWS SQS integration code. Future enhancements:
- **SQS Queue** - Message notifications
- **Lambda Function** - Process new entries
- **SES** - Email notifications for new guestbook entries

The integration is dormant (won't activate) until AWS credentials and `SQS_QUEUE_URL` environment variable are configured.

## Tech Stack

- **Docker & Docker Compose** - Containerization
- **nginx** - Web server and reverse proxy
- **Node.js/Express** - Backend API
- **PostgreSQL** - Database
- **AWS SDK** - SQS integration (optional)

## Documentation

- [QUICKSTART.md](./QUICKSTART.md) - Detailed startup guide with troubleshooting
- [backend/server.js](./backend/server.js) - Backend code with AWS integration

## Architecture

```
Browser
  ↓
nginx (port 80)
  ├─→ Static files (HTML/CSS)
  └─→ /api/* → Backend (port 3000)
              ↓
         PostgreSQL (port 5432)
              ↓
         (Optional) AWS SQS
```

## What You'll Learn

- Docker multi-container applications
- Service orchestration with docker-compose
- Nginx as a reverse proxy
- REST API development
- Database integration
- AWS SDK integration patterns

## Troubleshooting

**Containers won't start?**
- Make sure Docker Desktop is running
- Check ports 80, 3000, 5432 aren't in use

**Database errors?**
```bash
docker-compose down -v  # Remove old data
docker-compose up -d    # Fresh start
```

**Changes not showing?**
```bash
docker-compose up -d --build  # Rebuild containers
```

For more help, see [QUICKSTART.md](./QUICKSTART.md)
