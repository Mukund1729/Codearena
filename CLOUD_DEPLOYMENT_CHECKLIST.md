# CodeArena Cloud Deployment Checklist

## Files Changed

### Task 1: Redis/RabbitMQ Cloud URL Support
- **services/api-gateway/src/index.js** - Added REDIS_URL support with fallback to separate vars
- **services/execution-service/src/main/resources/application.yml** - Added RABBITMQ_URL + SSL support
- **services/contest-service/src/main/resources/application.yml** - Added REDIS_URL + SSL support
- **services/contest-service/src/main/java/com/codearena/contest/config/RedisConfig.java** - Added REDIS_URL support

### Task 2: CloudAMQP URL Format
- **services/execution-service/src/main/resources/application.yml** - Updated to prefer RABBITMQ_URL
- **services/websocket-service/src/index.js** - Already uses RABBITMQ_URL (no change needed)
- **services/submission-service/src/index.js** - Already uses RABBITMQ_URL (no change needed)

### Task 3: Upstash Redis URL Format
- **services/api-gateway/src/index.js** - Updated to prefer REDIS_URL
- **services/contest-service/src/main/java/com/codearena/contest/config/RedisConfig.java** - Added REDIS_URL support

### Task 4: Docker Limitation & Process Fallback
- **services/execution-service/DOCKER_LIMITATION.md** - Created documentation
- **services/execution-service/src/main/java/com/codearena/execution/service/ProcessExecutionService.java** - Created degraded execution mode
- **services/execution-service/src/main/java/com/codearena/execution/config/ExecutionConfig.java** - Added execution mode switching
- **services/execution-service/src/main/resources/application.yml** - Added EXECUTION_MODE config
- **services/execution-service/Dockerfile** - Created Dockerfile for Render deployment
- **services/contest-service/Dockerfile** - Created Dockerfile for Render deployment

### Task 5: render.yaml Updates
- **render.yaml** - Added all services with complete environment variables

## Pre-flight Check Results

### ✅ No Hardcoded Localhost in Production Code
All Redis/RabbitMQ connections now use environment variables with proper fallbacks:
- Node.js services: Support both URL format and separate vars
- Java services: Support both URL format and separate vars with SSL toggles
- Only localhost defaults remain for local development fallbacks

### ✅ render.yaml Environment Variables
Every service has all required environment variables:
- **API Gateway**: REDIS_URL, REDIS_HOST/PORT/PASSWORD, all service URLs
- **Problem Service**: All PostgreSQL variables
- **Submission Service**: All PostgreSQL + RabbitMQ variables  
- **Execution Service**: All PostgreSQL + RabbitMQ + EXECUTION_MODE + Docker config
- **WebSocket Service**: All RabbitMQ + Supabase + FRONTEND_URL
- **Contest Service**: All PostgreSQL + Redis variables
- **AI Review Service**: All PostgreSQL + OPENAI_API_KEY

### ✅ Frontend Configuration
Frontend uses environment variables (VITE_WS_URL) - no hardcoded URLs

## Manual Values to Fill In After Account Creation

### 1. Upstash Redis URL
**Create account at:** https://upstash.com
**Free tier available:** Yes

**After creating Redis database:**
- Copy the connection URL (format: `rediss://default:password@host.upstash.io:6379`)
- Set as `REDIS_URL` environment variable in all services that need Redis:
  - API Gateway
  - Contest Service
- Set `REDIS_SSL_ENABLED=true` for Java services

**Local development:** Continue using separate REDIS_HOST/PORT/PASSWORD variables

### 2. CloudAMQP RabbitMQ URL  
**Create account at:** https://www.cloudamqp.com
**Free tier available:** Yes (Little Lemur plan)

**After creating instance:**
- Copy the connection URL (format: `amqps://username:password@host.cloudamqp.com/vhost`)
- Set as `RABBITMQ_URL` environment variable in all services that need RabbitMQ:
  - Submission Service
  - Execution Service  
  - WebSocket Service
- Set `RABBITMQ_SSL_ENABLED=true` for Java services

**Local development:** Continue using separate RABBITMQ_HOST/PORT/USER/PASSWORD variables

### 3. Render Service URLs (After First Deploy)
**Deploy order matters:**
1. Deploy all services to Render first
2. Copy the generated URLs from Render dashboard
3. Update the following environment variables:

**API Gateway needs these URLs:**
- `PROBLEM_SERVICE_URL` = https://codearena-problem-service.onrender.com
- `SUBMISSION_SERVICE_URL` = https://codearena-submission-service.onrender.com  
- `EXECUTION_SERVICE_URL` = https://codearena-execution-service.onrender.com
- `AI_REVIEW_SERVICE_URL` = https://codearena-ai-review-service.onrender.com
- `WEBSOCKET_SERVICE_URL` = https://codearena-websocket-service.onrender.com

**WebSocket Service needs:**
- `FRONTEND_URL` = Your Vercel frontend URL (see step 4)

### 4. Vercel Frontend URL
**Deploy frontend to Vercel:**
1. Import GitHub repo to Vercel
2. Set root directory to `frontend`
3. Add environment variables:
   - `VITE_API_URL` = https://codearena-api-gateway.onrender.com
   - `VITE_WS_URL` = https://codearena-websocket-service.onrender.com

**After deployment:**
- Copy the Vercel URL (e.g., https://your-app.vercel.app)
- Add to WebSocket Service `FRONTEND_URL` environment variable
- Add to API Gateway CORS allowed origins if needed

### 5. Supabase Configuration
**Already configured in render.yaml:**
- `SUPABASE_URL` = https://dmttmadjkjydpjhgvnei.supabase.co
- `SUPABASE_ANON_KEY` = sb_publishable_PzuOo_2Xdwpe_oFv_6LMlQ_UpvQmb2m
- `SUPABASE_SERVICE_ROLE_KEY` = Set manually in Render dashboard (sync: false)

### 6. OpenAI API Key (Optional)
**For AI Review Service:**
- Set `OPENAI_API_KEY` in Render dashboard (sync: false)
- If not set, service uses fallback mock responses

### 7. Execution Mode Configuration
**For Render deployment:**
- Set `EXECUTION_MODE=process` (Docker-in-Docker not supported on Render free tier)
- This uses degraded execution mode without container isolation
- See services/execution-service/DOCKER_LIMITATION.md for details

**For production deployment on platforms with Docker socket:**
- Set `EXECUTION_MODE=docker` (default)
- Deploy on Fly.io, AWS EC2, or similar platform

## Deployment Steps

### Phase 1: Create Cloud Accounts
1. Create Upstash account and Redis database
2. Create CloudAMQP account and RabbitMQ instance
3. Copy connection URLs

### Phase 2: Deploy Backend Services to Render
1. Push code to GitHub
2. Import repo to Render using render.yaml blueprint
3. Fill in environment variables:
   - REDIS_URL (from Upstash)
   - RABBITMQ_URL (from CloudAMQP)
   - SUPABASE_SERVICE_ROLE_KEY
   - OPENAI_API_KEY (optional)
   - EXECUTION_MODE=process
4. Deploy all services

### Phase 3: Wire Service URLs
1. Copy deployed service URLs from Render dashboard
2. Update API Gateway environment variables with service URLs
3. Redeploy API Gateway

### Phase 4: Deploy Frontend to Vercel
1. Import repo to Vercel
2. Set VITE_API_URL and VITE_WS_URL
3. Deploy
4. Copy Vercel URL
5. Update WebSocket Service FRONTEND_URL
6. Redeploy WebSocket Service

### Phase 5: Test Deployment
1. Test user registration/login
2. Test problem listing (Kattis problems with string IDs)
3. Test code submission (will use process execution mode)
4. Test AI review (with or without OpenAI key)

## Important Notes

### Security
- All sensitive values use `sync: false` in render.yaml
- Never commit actual API keys to git
- Use strong JWT_SECRET in production

### Execution Mode Warning
- Render free tier uses degraded process execution mode
- This is for demo purposes only
- For production, use platform with Docker socket access

### SSL/TLS
- Upstash requires TLS (rediss://)
- CloudAMQP requires TLS (amqps://)
- Set SSL_ENABLED=true for Java services when using cloud providers

### Cost
- All services can run on free tiers:
  - Render: Free web services (spins down after inactivity)
  - Upstash: Free Redis tier
  - CloudAMQP: Free Little Lemur plan
  - Supabase: Free tier
  - Vercel: Free tier

### Local Development
- Local docker-compose setup continues to work unchanged
- Uses separate HOST/PORT/PASSWORD variables
- No SSL required locally
- EXECUTION_MODE defaults to docker locally

## Troubleshooting

### Redis Connection Issues
- Verify REDIS_URL format (rediss:// for TLS)
- Check REDIS_SSL_ENABLED=true for Java services
- Ensure Upstash instance is running

### RabbitMQ Connection Issues  
- Verify RABBITMQ_URL format (amqps:// for TLS)
- Check RABBITMQ_SSL_ENABLED=true for Java services
- Ensure CloudAMQP instance is running

### Service Communication Issues
- Verify all service URLs are correct
- Check Render service logs
- Ensure services are in same Render region

### Execution Issues on Render
- EXECUTION_MODE must be set to process
- Check logs for Docker socket errors
- See DOCKER_LIMITATION.md for details
