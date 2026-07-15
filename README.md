# CodeArena - Distributed Online Judge Platform

A distributed online judge platform similar to LeetCode/HackerRank, built with microservices architecture. This platform handles concurrent code submissions safely, executes them in isolated sandboxed containers, streams results in real-time, and supports live contests with leaderboards.

## Architecture Overview

### Microservices

1. **API Gateway** (Node.js/Express) - Single entry point, authentication, rate limiting, circuit breaker
2. **Problem Service** (Java Spring Boot) - Manages problems, test cases, editorial content
3. **Submission Service** (Node.js) - Receives code submissions, validates, queues for execution
4. **Execution Service** (Java Spring Boot) - Executes code in isolated Docker containers
5. **WebSocket Service** (Node.js + Socket.io) - Real-time result streaming and live leaderboard
6. **Contest Service** (Java Spring Boot) - Manages contests and Redis-based leaderboards
7. **AI Review Service** (Node.js) - Provides AI-powered code review and plagiarism detection

### Infrastructure

- **Databases**: PostgreSQL (relational data), MongoDB (execution logs), Redis (caching, leaderboards)
- **Message Queue**: RabbitMQ for async job processing
- **Storage**: AWS S3 for test cases and editorial files
- **Container Orchestration**: Kubernetes (EKS on AWS)
- **Monitoring**: Prometheus + Grafana

## Tech Stack

- **API Gateway**: Node.js, Express, JWT, Redis
- **Java Services**: Spring Boot, PostgreSQL, Docker
- **Node Services**: Express, Socket.io, RabbitMQ, OpenAI API
- **Frontend**: React, Monaco Editor, Tailwind CSS
- **Infrastructure**: Docker, Kubernetes, Terraform, AWS

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Java 17+
- PostgreSQL 13+
- Redis 7+
- RabbitMQ 3.12+

### Local Development

1. Clone the repository
2. Start infrastructure services:
   ```bash
   docker-compose up -d postgres mongodb redis rabbitmq
   ```

3. Initialize databases:
   ```bash
   npm run db:init
   ```

4. Start individual services:
   ```bash
   # API Gateway
   cd services/api-gateway
   npm install
   npm run dev

   # Problem Service
   cd services/problem-service
   mvn spring-boot:run

   # Submission Service
   cd services/submission-service
   npm install
   npm run dev

   # Execution Service
   cd services/execution-service
   mvn spring-boot:run

   # WebSocket Service
   cd services/websocket-service
   npm install
   npm run dev

   # Contest Service
   cd services/contest-service
   mvn spring-boot:run

   # AI Review Service
   cd services/ai-review-service
   npm install
   npm run dev
   ```

5. Start frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   The frontend dev server runs on `http://localhost:5173` and proxies API requests to the API Gateway at `http://localhost:3000`.
For Docker-less local development, see `START_LOCAL.md` for infrastructure setup and service startup commands.
### Docker Compose (All Services)

```bash
docker-compose up -d
```

## Key Features

- **Sandboxed Execution**: Code runs in isolated Docker containers with strict resource limits
- **Real-time Streaming**: WebSocket-based result delivery
- **Live Contests**: Redis-backed leaderboards with O(log n) updates
- **AI Code Review**: OpenAI GPT-4o integration for feedback and hints
- **Plagiarism Detection**: Vector embeddings with cosine similarity
- **Multi-language Support**: Python, Java, C++, JavaScript
- **Circuit Breaker**: Fault tolerance for service degradation
- **Rate Limiting**: Redis-based sliding window (5 submissions/minute)

## Security

- JWT-based authentication
- Container isolation with no network access
- Resource limits (CPU: 0.5 cores, Memory: 256MB)
- No filesystem write access outside /tmp
- IAM roles with least privilege

## Monitoring

- Prometheus metrics for all services
- Grafana dashboards for:
  - Submissions per second
  - Execution queue depth
  - Container spin-up latency
  - p50/p95/p99 execution time
- Structured JSON logging with correlation IDs
- Alerting on queue depth > 100 jobs

## Load Testing

```bash
k6 run load-tests/submission-test.js
```

Target metrics:
- Container spin-up time: < 800ms
- WebSocket result delivery: < 3 seconds end-to-end
- Redis leaderboard reads: 1000+ concurrent viewers

## Project Structure

```
codearena/
├── services/
│   ├── api-gateway/          # Node.js/Express
│   ├── problem-service/      # Java Spring Boot
│   ├── submission-service/   # Node.js
│   ├── execution-service/    # Java Spring Boot
│   ├── websocket-service/   # Node.js + Socket.io
│   ├── contest-service/      # Java Spring Boot
│   └── ai-review-service/    # Node.js
├── frontend/                 # React + Monaco Editor
├── infrastructure/
│   ├── docker/              # Dockerfiles
│   ├── kubernetes/          # K8s manifests
│   └── terraform/           # AWS infrastructure
├── database/
│   ├── postgres/            # Schema migrations
│   ├── mongodb/             # Indexes and collections
│   └── redis/               # Data structures
└── docs/                    # Architecture docs
```

## Contributing

This is a demonstration project for MNC interviews. The architecture showcases:
- Microservices design patterns
- Distributed systems challenges
- Cloud-native development
- Security best practices
- Real-time data streaming

## License

MIT License
