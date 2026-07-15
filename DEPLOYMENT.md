# CodeArena Deployment Guide for Render.com

## Prerequisites
- Render.com account (free tier available)
- GitHub repository with your code
- Supabase account (already configured)
- CloudAMQP account (for RabbitMQ - free tier available)

## Step 1: Prepare Your Repository

1. Push your code to GitHub
2. Make sure all environment variables are set in Render (not in .env)

## Step 2: Deploy Services to Render

### Option A: Using render.yaml (Recommended)

1. Go to [Render.com](https://render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml`
5. Review and deploy

### Option B: Manual Deployment

#### 1. Deploy Redis (Database)
- Go to Render → New → PostgreSQL (for Redis, use external service)
- Or use [Upstash Redis](https://upstash.com) (better free tier)

#### 2. Deploy RabbitMQ
- Use [CloudAMQP](https://www.cloudamqp.com) (free tier available)
- Create a new instance and get the connection URL

#### 3. Deploy Each Service

**API Gateway:**
- New → Web Service
- Name: `codearena-api-gateway`
- Runtime: Node
- Build Command: `cd services/api-gateway && npm install`
- Start Command: `cd services/api-gateway && npm start`
- Add environment variables from your .env

**Problem Service:**
- New → Web Service
- Name: `codearena-problem-service`
- Runtime: Docker
- Docker Context: `./services/problem-service`
- Add environment variables

**Submission Service:**
- New → Web Service
- Name: `codearena-submission-service`
- Runtime: Node
- Build Command: `cd services/submission-service && npm install`
- Start Command: `cd services/submission-service && npm start`

**WebSocket Service:**
- New → Web Service
- Name: `codearena-websocket-service`
- Runtime: Node
- Build Command: `cd services/websocket-service && npm install`
- Start Command: `cd services/websocket-service && npm start`

**AI Review Service:**
- New → Web Service
- Name: `codearena-ai-review-service`
- Runtime: Node
- Build Command: `cd services/ai-review-service && npm install`
- Start Command: `cd services/ai-review-service && npm start`

## Step 3: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `frontend`
4. Add environment variables:
   - `VITE_API_URL`: Your Render API Gateway URL
   - `VITE_WS_URL`: Your Render WebSocket Service URL

## Step 4: Update Environment Variables

After deployment, update these URLs in your services:

**In API Gateway:**
- `PROBLEM_SERVICE_URL`: https://codearena-problem-service.onrender.com
- `SUBMISSION_SERVICE_URL`: https://codearena-submission-service.onrender.com
- `AI_REVIEW_SERVICE_URL`: https://codearena-ai-review-service.onrender.com
- `WEBSOCKET_SERVICE_URL`: https://codearena-websocket-service.onrender.com

**In Frontend (.env):**
- `VITE_API_URL`: https://codearena-api-gateway.onrender.com
- `VITE_WS_URL`: https://codearena-websocket-service.onrender.com

## Step 5: Update CORS Settings

Make sure your services allow requests from your Vercel domain:

**In API Gateway (services/api-gateway/src/index.js):**
```javascript
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```

## Important Notes

1. **Free Tier Limitations**: Render free tier spins down after 15 minutes of inactivity
2. **Cold Starts**: First request after spin-down may take 30-60 seconds
3. **Database**: Use Supabase for PostgreSQL (already configured)
4. **Redis**: Use Upstash for better free tier
5. **RabbitMQ**: CloudAMQP has a generous free tier

## Cost Estimate (Free Tier)

- Render Web Services: Free (5 services)
- Redis: Free (Upstash)
- RabbitMQ: Free (CloudAMQP)
- PostgreSQL: Free (Supabase)
- Vercel Frontend: Free
- **Total: $0/month**

## Troubleshooting

**Services not starting:**
- Check logs in Render dashboard
- Verify environment variables
- Ensure build commands are correct

**CORS errors:**
- Update CORS settings in all services
- Add your Vercel domain to allowed origins

**Database connection issues:**
- Verify Supabase connection string
- Check Supabase allows connections from Render IPs
