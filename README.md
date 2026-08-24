# Scheduler Service

Central job scheduling & automation engine for the **SKONGA AI** ecosystem.

## Intentions

- Automate background jobs
- Simplify recurring tasks (daily, weekly, monthly)
- Enable time-based workflows across the platform
- Act as the automation engine behind the scenes

## Features

- Create scheduled jobs with cron expressions
- Persist jobs in MongoDB
- Automatically load & run active jobs on startup
- Trigger Notification Service, Analytics Service, etc.
- Full job management (list, update, cancel)

## Endpoints

| Method | Endpoint          | Description                  |
|--------|-------------------|------------------------------|
| POST   | `/schedule`       | Create a new scheduled job   |
| GET    | `/jobs`           | List all jobs                |
| GET    | `/jobs/:id`       | Get single job               |
| PATCH  | `/jobs/:id`       | Update job                   |
| DELETE | `/jobs/:id`       | Cancel job                   |
| GET    | `/health`         | Health check                 |

### Example: Create a reminder job

```json
POST /schedule
{
  "jobName": "physics-reminder",
  "cronExpression": "0 9 * * *",
  "action": "send_notification",
  "payload": {
    "userId": "user_123",
    "title": "Reminder",
    "message": "Una siku 3 haujapitia somo lako pendwa la physics..."
  }
}
```

## Quick Start

```bash
cp .env.example .env
npm install
npm run dev
```

## Run with Docker

```bash
docker build -t scheduler-service .
docker run -p 4001:4001 --env-file .env scheduler-service
```

## Testing

```bash
npm test
```
