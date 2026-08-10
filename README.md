# CodeArena

A modern distributed online judge platform built for demo, portfolio, and technical interview use. CodeArena combines microservices, real-time updates, containerized code execution, Supabase authentication, and full-stack deployment infrastructure into one production-like project.

---

## What CodeArena Does

CodeArena simulates a competitive programming platform with the following capabilities:

- User registration, login, and profile management using Supabase Auth
- Problem browsing, filtering, and detail pages
- Secure code submission and async execution via RabbitMQ jobs
- Sandboxed code execution inside Docker containers
- Live contest leaderboard updates through WebSockets
- AI-powered code review and plagiarism detection
- Persistent data storage using PostgreSQL, MongoDB, and Redis
- Local and cloud-ready deployment with Docker Compose, Kubernetes, and Terraform

---

## Why this project is strong

- **Full-stack distributed architecture** with Node.js and Spring Boot services.
- **Real-time collaboration** via Socket.io and leaderboard streaming.
- **Secure execution pipeline** that isolates user code in Docker containers.
- **Modern auth and API gateway** with Supabase integration and rate limiting.
- **Resume-ready impact**: demonstrates systems design, cloud-native deployment, event-driven workflows, and real-time UX.

---

## Architecture Overview

### Core services

- **API Gateway** (`services/api-gateway`) — Authentication, request routing, rate limiting, and service orchestration.
- **Problem Service** (`services/problem-service`) — Spring Boot service for problem metadata and test cases.
- **Submission Service** (`services/submission-service`) — Node.js service for intake validation and job dispatch.
- **Execution Service** (`services/execution-service`) — Spring Boot service that runs code inside isolated containers.
- **WebSocket Service** (`services/websocket-service`) — Real-time notifications, leaderboard broadcasts, and contest updates.
- **Contest Service** (`services/contest-service`) — Spring Boot contest management and Redis leaderboard handling.
- **AI Review Service** (`services/ai-review-service`) — OpenAI-powered code feedback and plagiarism analysis.

### Infrastructure services

- **PostgreSQL** — Relational storage for users, problems, contests, and submissions.
- **MongoDB** — Logging, execution history, and audit records.
- **Redis** — Leaderboards, caching, and rate limiting.
- **RabbitMQ** — Job queue for asynchronous submission execution.
- **Docker Compose** — Local orchestration for the full stack.
- **Kubernetes / Terraform** — Cloud deployment manifests included.

---

## Technology Stack

- **Frontend:** React + Vite + Tailwind CSS
- **API Gateway / Services:** Node.js, Express, Socket.io
- **Microservices:** Java Spring Boot, RabbitMQ, Docker
- **Databases:** PostgreSQL, MongoDB, Redis
- **Authentication:** Supabase Auth
- **AI:** OpenAI API for code review
- **Deployment:** Docker Compose, Kubernetes manifests, Terraform support

---

## Runtime Ports

| Service | Port |
|---|---|
| Frontend | `5173` |
| API Gateway | `3000` |
| Problem Service | `3001` |
| Submission Service | `3002` |
| Execution Service | `3003` |
| WebSocket Service | `3004` |
| Contest Service | `3005` |
| AI Review Service | `3006` |
| RabbitMQ | `5672` / `15672` |
| Redis | `6379` |
| MongoDB | `27017` |
| PostgreSQL | `5432` |

---

## Quick Start

### 1. Prepare environment variables

Copy and update a `.env` file at the repo root:

```env
SUPABASE_URL=https://<your-supabase-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
OPENAI_API_KEY=<openai-api-key>   # optional
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_HOST=localhost
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=codearena
POSTGRES_USER=codearena
POSTGRES_PASSWORD=codearena123
JWT_SECRET=<strong-secret>
```

> Note: Supabase Auth requires Node 22 or newer in the Node.js services.

### 2. Start the full stack

```bash
docker-compose up -d
```

### 3. Verify the stack

```bash
docker-compose ps
docker-compose logs -f api-gateway
```

### 4. Open the app

- Frontend: `http://localhost:5173`
- API Gateway: `http://localhost:3000`
- RabbitMQ UI: `http://localhost:15672`

---

## Developer Workflow

### Start frontend locally

```bash
cd frontend
npm install
npm run dev
```

### Start Node services locally

```bash
cd services/api-gateway
npm install
npm run dev
```

Repeat for:
- `services/submission-service`
- `services/websocket-service`
- `services/ai-review-service`

### Start Java services locally

```bash
cd services/problem-service
mvn clean install
mvn spring-boot:run
```

Repeat for:
- `services/execution-service`
- `services/contest-service`

---

## Key Endpoints

### API Gateway

- `POST /auth/register`
- `POST /auth/login`
- `GET /api/problems`
- `GET /api/problems/:id`
- `POST /api/submissions`
- `GET /api/submissions/:id`
- `GET /api/contests`
- `GET /api/contests/:id/leaderboard`
- `POST /api/ai/review`

### WebSocket

- Connect to `http://localhost:3004` with Socket.io for live submission and leaderboard updates.

### AI Review

- `POST /review`
- `POST /plagiarism`

---

## Recommended Demo Flow

1. Register and login through the frontend.
2. Browse problems and select a challenge.
3. Submit code and watch the async execution pipeline.
4. Observe live leaderboard updates in contest mode.
5. Trigger AI review for code feedback.

---

## Why this project belongs on your resume

- Demonstrates a **distributed microservices architecture** across Node.js and Java.
- Shows experience with **real-time systems** using WebSockets and Redis.
- Proves **secure, isolated execution** of user-submitted code in Docker.
- Includes **cloud-native deployment artifacts** and production-style infrastructure.
- Supports **modern auth** via Supabase and optional AI integration.

---

## Project Structure

```text
codearena/
├── services/
│   ├── api-gateway/
│   ├── problem-service/
│   ├── submission-service/
│   ├── execution-service/
│   ├── websocket-service/
│   ├── contest-service/
│   └── ai-review-service/
├── frontend/
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   └── terraform/
├── database/
│   ├── mongo/
│   ├── postgres/
│   └── redis/
├── load-tests/
├── docs/
├── docker-compose.yml
├── docker-compose.infrastructure.yml
├── START_LOCAL.md
└── README.md
```

---

## Deployment Notes

- Cloud manifests are included for Kubernetes and Render.
- Sensitive secrets should be managed outside the repo.
- Use persistent volumes for Redis, PostgreSQL, and MongoDB in production.
- The execution service must run with Docker socket access and a secure sandbox policy.

---

## Troubleshooting

### Common commands

```bash
docker-compose logs -f
docker-compose restart
docker-compose down -v
```

### Health checks

- Ensure `mongodb`, `rabbitmq`, `redis`, and `postgres` are healthy before starting services.
- Check the API gateway logs for Supabase auth errors and service proxy failures.

---

## License

MIT License
