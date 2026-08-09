# CodeArena - Distributed Online Judge Platform

CodeArena is a distributed online judge platform designed as a production-like full-stack demo. It combines microservices, modern authentication, real-time streaming, containerized execution, and leaderboard management to model a competitive coding platform similar to LeetCode or HackerRank.

## Why this project is strong

- **Microservices architecture:** clear separation between gateway, contest, submission, execution, real-time, and AI review services.
- **Real-time behavior:** WebSockets deliver live updates and contest leaderboard events.
- **Production patterns:** service discovery, health checks, circuit breakers, rate limiting, and environment-based configuration.
- **Modern auth:** Supabase Auth integration for signup/login and user profile management.
- **Containerized execution:** Java execution service runs code in isolated Docker containers.
- **Cloud-ready:** Docker Compose and Kubernetes/Render deployment manifests are included.

Yes, this repo is strong enough to present on a resume if you highlight the distributed design, live demo capability, and cloud/native integrations. The Docker configuration appears complete and aligned with the service architecture, but runtime verification is required to confirm all containers start successfully without errors.

## Architecture

### Services

- **API Gateway** (`services/api-gateway`) — Express-based request routing, Supabase auth, rate limiting, and service proxying.
- **Problem Service** (`services/problem-service`) — Java Spring Boot service that manages problems and test cases.
- **Submission Service** (`services/submission-service`) — Node.js service that validates submissions and publishes execution jobs.
- **Execution Service** (`services/execution-service`) — Java Spring Boot service that executes code in sandboxed Docker containers.
- **WebSocket Service** (`services/websocket-service`) — handles real-time client notifications and contest leaderboard pushes.
- **Contest Service** (`services/contest-service`) — Java Spring Boot contest manager with Redis-backed leaderboards.
- **AI Review Service** (`services/ai-review-service`) — Node.js service for AI feedback and plagiarism detection.

### Infrastructure

- **PostgreSQL** for relational data.
- **MongoDB** for execution logs and audit data.
- **Redis** for leaderboards, caching, and rate limiting.
- **RabbitMQ** for async job queueing and result streaming.
- **Docker Compose** for local orchestration.
- **Kubernetes / Terraform** support for cloud deployment.

## What is already configured

- `docker-compose.yml` includes all required infrastructure and microservices.
- Service ports are fixed and documented.
- Services use container hostnames on the Docker network (`redis`, `rabbitmq`, `postgres`).
- Supabase values are expected from environment variables.
- AI Review is optional; it requires `OPENAI_API_KEY`.

## Runtime ports

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

## Required environment variables

Create a root `.env` file with at least:

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
```

## Local development using Docker

1. Start the full stack:
   ```bash
   docker-compose up -d
   ```

2. Confirm containers are healthy:
   ```bash
   docker-compose ps
   docker-compose logs -f api-gateway
   ```

3. Start services or frontend as needed:
   - Frontend: `cd frontend && npm install && npm run dev`
   - The frontend proxies to API Gateway at `http://localhost:3000`.

## Local development without Docker

If you prefer local services, use `START_LOCAL.md` for setup instructions for PostgreSQL, Redis, RabbitMQ, and Supabase.

## Running the application

- Frontend: `http://localhost:5173`
- API Gateway: `http://localhost:3000`
- Auth endpoints: `/auth/register`, `/auth/login`.
- Contest leaderboard: `/api/contests/<contestId>/leaderboard`.

## Deployment notes

- This repo includes `render.yaml` and Kubernetes manifests for cloud deployment.
- For a production-ready demo, ensure:
  - Supabase secrets are stored securely
  - Docker host mount for execution service is protected
  - OpenAI key is not exposed publicly
  - Redis and RabbitMQ are deployed with persistence

## Strength assessment

- **Strength:** High for a resume/project demo because it combines distributed systems, real-time messaging, auth, and containerized execution.
- **Docker readiness:** The Docker Compose stack is configured and appears complete. It should work, but you should run it once to confirm there are no runtime failures.
- **What to improve for an interview demo:** A public live URL, secure secret handling, readable deployment documentation, and a demo script for reviewers.

## Project structure

```
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
└── docs/
```

## What to say in your resume

- Built a distributed online judge with Node.js and Spring Boot microservices.
- Implemented real-time contest leaderboards using Socket.io and Redis.
- Added asynchronous submission processing with RabbitMQ.
- Integrated Supabase Auth and containerized sandboxed code execution.
- Included Docker Compose and Kubernetes deployment manifests.

## License

MIT License
