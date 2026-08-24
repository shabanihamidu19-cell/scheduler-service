# Scheduler Service

**Production-ready job scheduling & automation engine** for the SKONGA AI ecosystem.

Built with **Agenda.js**, Express, MongoDB, Winston, and Joi.

---

## Intentions

| Goal | Description |
|------|-------------|
| **Automate background jobs** | Run tasks reliably in the background |
| **Recurring & one-time jobs** | Daily, weekly, monthly or delayed one-off jobs |
| **Time-based workflows** | Power notifications, reports, cleanups across the platform |
| **Central automation engine** | Single source of truth for all scheduled work in SKONGA AI |

---

## Tech Stack

- **Agenda.js** – Persistent, MongoDB-backed job scheduler (production grade)
- **Express** + Helmet + Rate Limiting
- **Winston** – Structured logging
- **Joi** – Request validation
- **Mongoose** + MongoDB
- Graceful shutdown & health checks

---

## Features

- Recurring jobs via cron expressions (with timezone support)
- One-time delayed jobs (`runAt`)
- Unique jobs by name (prevents duplicates)
- Job management: list, get, update, pause, cancel
- Automatic retry on failure (Agenda handles it)
- Triggers external services (Notification, Analytics, etc.)
- Rate limiting + proper error handling
- Health endpoint that reports Agenda readiness
- Graceful shutdown on SIGTERM / SIGINT

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/schedule` | Create a new job |
| `GET` | `/jobs` | List jobs (supports `?status=&action=&page=&limit=`) |
| `GET` | `/jobs/:id` | Get single job |
| `PATCH` | `/jobs/:id` | Update job (cron, payload, status...) |
| `DELETE` | `/jobs/:id` | Cancel & remove job |
| `GET` | `/health` | Health + Agenda status |

### Create a recurring reminder

```http
POST /schedule
Content-Type: application/json

{
  "jobName": "physics-reminder",
  "cronExpression": "0 9 * * *",
  "action": "send_notification",
  "timezone": "Africa/Nairobi",
  "payload": {
    "userId": "user_123",
    "title": "Reminder",
    "message": "Una siku 3 haujapitia somo lako pendwa la physics..."
  }
}
```

### Create a one-time job

```json
{
  "jobName": "welcome-followup",
  "action": "send_notification",
  "runAt": "2026-08-25T10:00:00.000Z",
  "payload": {
    "userId": "user_456",
    "message": "Karibu tena kwenye SKONGA AI!"
  }
}
```

---

## Quick Start

```bash
git clone https://github.com/shabanihamidu19-cell/scheduler-service.git
cd scheduler-service
cp .env.example .env
npm install
npm run dev
```

Service will start on `http://localhost:4001`

---

## Docker

```bash
# Build
docker build -t scheduler-service .

# Run (requires MongoDB)
docker run -p 4001:4001 --env-file .env scheduler-service
```

Or with docker-compose (recommended for local):

```bash
docker-compose up -d
```

---

## Environment Variables

See `.env.example` for the full list.

Key ones:
- `MONGODB_URI`
- `PORT`
- `NOTIFICATION_SERVICE_URL`
- `ANALYTICS_SERVICE_URL`

---

## Project Structure

```
src/
├── config/           # Environment & app config
├── middleware/       # Error handler + Joi validation
├── services/         # Agenda-powered scheduler core
├── controllers/      # Request handlers
├── routes/           # API routes
├── utils/            # Winston logger
└── app.js            # Express bootstrap + graceful shutdown
```

---

## License

MIT © SKONGA AI Team
