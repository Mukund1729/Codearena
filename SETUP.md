# CodeArena Setup Guide

This guide will help you set up and run the CodeArena distributed online judge platform locally.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development without Docker)
- Java 17+ (for local development without Docker)
- Maven 3.9+ (for local development without Docker)
- AWS Account (for S3 storage - optional for local development)
- OpenAI API Key (for AI Review Service - optional)

## Quick Start with Docker Compose

### 1. Clone and Setup

```bash
cd codearena
cp .env.example .env
```

Edit `.env` file with your configuration:
- Add AWS credentials if using S3
- Add OpenAI API key if using AI Review
- Update JWT secret for production

### 2. Start Infrastructure Services

```bash
docker-compose -f docker-compose.infrastructure.yml up -d
```

This starts:
- PostgreSQL (port 5432)
- MongoDB (port 27017)
- Redis (port 6379)
- RabbitMQ (ports 5672, 15672)

### 3. Initialize Database

The PostgreSQL database will be automatically initialized with the schema from `database/postgres/init.sql`.

### 4. Start All Services

```bash
docker-compose up -d
```

This starts all microservices:
- API Gateway (port 3000)
- Problem Service (port 3001)
- Submission Service (port 3002)
- Execution Service (port 3003)
- WebSocket Service (port 3004)
- Contest Service (port 3005)
- AI Review Service (port 3006)

### 5. Verify Services

```bash
# Check API Gateway
curl http://localhost:3000/health

# Check RabbitMQ Management UI
open http://localhost:15672
# Username: guest, Password: guest
```

## Local Development (Without Docker)

### 1. Start Infrastructure

```bash
docker-compose -f docker-compose.infrastructure.yml up -d
```

### 2. Install Dependencies

```bash
# API Gateway
cd services/api-gateway
npm install

# Submission Service
cd ../submission-service
npm install

# WebSocket Service
cd ../websocket-service
npm install

# AI Review Service
cd ../ai-review-service
npm install

# Problem Service
cd ../problem-service
mvn clean install

# Execution Service
cd ../execution-service
mvn clean install

# Contest Service
cd ../contest-service
mvn clean install
```

### 3. Start Services

Open separate terminals for each service:

```bash
# Terminal 1 - API Gateway
cd services/api-gateway
npm run dev

# Terminal 2 - Submission Service
cd services/submission-service
npm run dev

# Terminal 3 - WebSocket Service
cd services/websocket-service
npm run dev

# Terminal 4 - AI Review Service
cd services/ai-review-service
npm run dev

# Terminal 5 - Problem Service
cd services/problem-service
mvn spring-boot:run

# Terminal 6 - Execution Service
cd services/execution-service
mvn spring-boot:run

# Terminal 7 - Contest Service
cd services/contest-service
mvn spring-boot:run
```

## Service Endpoints

### API Gateway (Port 3000)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /api/problems` - Get all problems
- `GET /api/problems/:id` - Get problem by ID
- `POST /api/submissions` - Submit code
- `GET /api/submissions/:id` - Get submission result
- `GET /api/contests` - Get all contests
- `GET /api/contests/:id/leaderboard` - Get contest leaderboard
- `POST /api/ai/review` - Get AI code review

### Problem Service (Port 3001)
- `GET /problems` - Get all problems
- `GET /problems/:id` - Get problem by ID
- `POST /problems` - Create problem (admin)
- `PUT /problems/:id` - Update problem (admin)

### Submission Service (Port 3002)
- `POST /submissions` - Submit code
- `GET /submissions/:submissionId` - Get submission result
- `GET /submissions` - Get user submissions

### Execution Service (Port 3003)
- Consumes jobs from RabbitMQ
- Executes code in Docker containers
- No direct HTTP endpoints

### WebSocket Service (Port 3004)
- WebSocket connection for real-time updates
- Socket.io client connection

### Contest Service (Port 3005)
- `GET /contests/:id/leaderboard` - Get leaderboard
- `POST /contests/:id/leaderboard` - Update score

### AI Review Service (Port 3006)
- `POST /review` - Get code review
- `POST /plagiarism` - Check plagiarism

## Testing the System

### 1. Register a User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the token from the response.

### 3. Submit Code

```bash
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "problemId": 1,
    "language": "python",
    "code": "print(\"Hello, World!\")"
  }'
```

### 4. Check Submission Result

```bash
curl -X GET http://localhost:3000/api/submissions/SUBMISSION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Docker Issues

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Clean up volumes
docker-compose down -v
```

### Database Connection Issues

Ensure PostgreSQL is running:
```bash
docker-compose logs postgres
```

### RabbitMQ Connection Issues

Check RabbitMQ Management UI:
```bash
open http://localhost:15672
```

### Execution Service Issues

The Execution Service requires Docker-in-Docker. Ensure:
- Docker socket is mounted: `/var/run/docker.sock:/var/run/docker.sock`
- The service has permission to access Docker

## Production Deployment

For production deployment, refer to:
- `infrastructure/kubernetes/` - Kubernetes manifests
- `infrastructure/terraform/` - Terraform infrastructure
- `.github/workflows/` - CI/CD pipelines

## Monitoring

- Prometheus metrics available at `/actuator/prometheus` for Java services
- Health checks at `/health` for all services
- RabbitMQ Management UI at `http://localhost:15672`

## Support

For issues or questions, please refer to the main README.md or create an issue in the repository.
