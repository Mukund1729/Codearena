# Running CodeArena Locally (Without Docker)

Since Docker Desktop is having issues, here's how to run CodeArena locally.

## Prerequisites

### 1. Supabase Account (Required for Authentication)
- Create a free account at https://supabase.com
- Create a new project
- Run the SQL setup script from `database/supabase/setup.sql` in your Supabase SQL editor
- Get your project URL and anon keys from Supabase dashboard
- Add them to your `.env` file

### 2. Optional Local Services
Only needed if you want to use local databases instead of Supabase:

#### PostgreSQL 15
- Download: https://www.postgresql.org/download/windows/
- Install with default settings
- Set password: `codearena123`
- Create database: `codearena`

#### MongoDB 7
- Download: https://www.mongodb.com/try/download/community
- Install with default settings
- Create database: `codearena`

#### Redis 7
- Download: https://redis.io/download
- Or use Memurai (Windows-compatible Redis): https://www.memurai.com/get-memurai
- Install and start as service

#### RabbitMQ 3.12
- Download: https://www.rabbitmq.com/download.html
- Install with Erlang (required)
- Default credentials: guest/guest
- Management UI: http://localhost:15672

## Quick Start Scripts

### Option 1: Essential Services (Recommended for Development)
This starts only the services needed for the core functionality:
- API Gateway (with Supabase Auth)
- Problem Service (Codeforces/Kattis problems)
- Frontend

```batch
start-essential-services.bat
```

### Option 2: All Services
This starts all services including submission, WebSocket, and AI review:

```batch
start-all-services.bat
```

### Option 3: Stop All Services
```batch
stop-all-services.bat
```

### Option 4: Manual Start
Run these commands in separate terminals:

#### Terminal 1 - API Gateway
```bash
cd services/api-gateway
npm run dev
```

#### Terminal 2 - Problem Service (Java)
```bash
cd services/problem-service
mvn spring-boot:run
```

#### Terminal 3 - Frontend
```bash
cd frontend
npm run dev
```

#### Optional: Additional Services
```bash
# Terminal 4 - Submission Service
cd services/submission-service
npm run dev

# Terminal 5 - WebSocket Service
cd services/websocket-service
npm run dev

# Terminal 6 - AI Review Service
cd services/ai-review-service
npm run dev
```

## Environment Variables

Create or update the shared `.env` file in the repository root:

```env
# Supabase Configuration (Required for Authentication)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Local Database Configuration (if not using Supabase)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Optional: Additional Services
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_HOST=localhost
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
MONGO_HOST=localhost
MONGO_PORT=27017

# Application Configuration
JWT_SECRET=codearena-secret-key-2024
OPENAI_API_KEY=
VITE_API_URL=/api
VITE_WS_URL=http://localhost:3004
FRONTEND_URL=http://localhost:5174
```

Create a `.env` file in the `frontend` directory for Vite:

```env
VITE_API_URL=/api
VITE_WS_URL=http://localhost:3004
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Access Points

- Frontend: http://localhost:5174
- API Gateway: http://localhost:3000
- Supabase Dashboard: https://supabase.com/dashboard

## Current Architecture

- **Authentication**: Supabase Auth (login/signup)
- **Problems**: Codeforces and Kattis APIs (no local database needed)
- **Code Execution**: Optional execution service for running submissions
- **AI Review**: Optional AI service for code reviews
- **Real-time**: Optional WebSocket service for live updates

## Troubleshooting

### Supabase Connection Issues
- Verify your Supabase project URL and keys in `.env`
- Ensure you ran the SQL setup script in Supabase
- Check Supabase dashboard for any auth configuration issues

### Port Conflicts
If ports are already in use, run `stop-all-services.bat` first or change ports in service configs.

### Java Version Issues
Ensure Java 17+ is installed. Current version: Java 25 (should work fine).

### Problems Not Loading
- Check that Problem Service is running on port 3001
- Verify API Gateway is running on port 3000
- Check browser console for API errors
