const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const express = require('express');
const redis = require('redis');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const { createRedisStore } = require('./redisStore');
const { createClient } = require('@supabase/supabase-js');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/gateway.log' })
  ]
});

// Initialize Express app
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Redis client for rate limiting and caching
let redisClient;
let redisStore;

// Supabase client for authentication
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function initRedis() {
  try {
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      },
      password: process.env.REDIS_PASSWORD
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    await redisClient.connect();
    redisStore = createRedisStore(redisClient, logger);
    logger.info('Connected to Redis successfully');
  } catch (error) {
    logger.warn('Redis unavailable, falling back to in-memory store');
    redisStore = createRedisStore(null, logger);
  }
}

initRedis();     

// Service URLs
const SERVICES = {
  problemService: process.env.PROBLEM_SERVICE_URL || 'http://localhost:3001',
  submissionService: process.env.SUBMISSION_SERVICE_URL || 'http://localhost:3002',
  executionService: process.env.EXECUTION_SERVICE_URL || 'http://localhost:3003',
  contestService: process.env.CONTEST_SERVICE_URL || 'http://localhost:3005',
  aiReviewService: process.env.AI_REVIEW_SERVICE_URL || 'http://localhost:3006'
};

// Circuit Breaker State
const circuitBreakerState = {
  executionService: {
    failures: 0,
    lastFailureTime: null,
    state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
    threshold: 5,
    timeout: 60000 // 1 minute
  }
};

// JWT Secret (kept for backward compatibility, but Supabase Auth is the primary auth system)
const JWT_SECRET = process.env.JWT_SECRET || 'codearena-secret-key-2024';

async function validateSupabaseToken(token) {
  try {
    const response = await axios.get(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json'
      }
    });

    return { user: response.data };
  } catch (error) {
    return {
      error: true,
      message: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
}

// Middleware: Correlation ID
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
});

// Middleware: Request Logging
app.use((req, res, next) => {
  logger.info({
    correlationId: req.correlationId,
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Middleware: JWT Authentication
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const { user, error } = await validateSupabaseToken(token);
  if (error) {
    logger.error({
      correlationId: req.correlationId,
      error: 'Invalid token',
      details: error?.message || `status=${error?.status}`
    });
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = {
    id: user.id,
    email: user.email,
    username: user.user_metadata?.username || null
  };
  next();
};

// Middleware: Redis-based Rate Limiting (Sliding Window)
const rateLimiter = async (req, res, next) => {
  const userId = req.user?.id || req.ip;
  const key = `ratelimit:${userId}`;
  const now = Date.now();
  const window = 60 * 1000; // 1 minute
  const maxRequests = 5;

  try {
    // Remove old entries outside the window
    await redisStore.zRemRangeByScore(key, 0, now - window);

    // Count current requests
    const count = await redisStore.zCard(key);

    if (count >= maxRequests) {
      logger.warn({
        correlationId: req.correlationId,
        userId,
        message: 'Rate limit exceeded'
      });
      return res.status(429).json({ 
        error: 'Too many requests',
        limit: maxRequests,
        window: '1 minute'
      });
    }

    // Add current request
    await redisStore.zAdd(key, [{ score: now, value: `${now}-${uuidv4()}` }]);
    await redisStore.expire(key, 60);

    next();
  } catch (error) {
    logger.error({
      correlationId: req.correlationId,
      error: 'Rate limiter error',
      details: error.message
    });
    // Fail open - allow request if rate limiter fails
    next();
  }
};

// Circuit Breaker Check
const checkCircuitBreaker = (serviceName) => {
  const state = circuitBreakerState[serviceName];
  if (!state) return true;

  const now = Date.now();

  if (state.state === 'OPEN') {
    if (now - state.lastFailureTime > state.timeout) {
      state.state = 'HALF_OPEN';
      logger.info(`Circuit breaker for ${serviceName} moved to HALF_OPEN`);
      return true;
    }
    return false;
  }

  return true;
};

// Circuit Breaker Record Success
const recordSuccess = (serviceName) => {
  const state = circuitBreakerState[serviceName];
  if (!state) return;

  state.failures = 0;
  if (state.state === 'HALF_OPEN') {
    state.state = 'CLOSED';
    logger.info(`Circuit breaker for ${serviceName} moved to CLOSED`);
  }
};

// Circuit Breaker Record Failure
const recordFailure = (serviceName) => {
  const state = circuitBreakerState[serviceName];
  if (!state) return;

  state.failures++;
  state.lastFailureTime = Date.now();

  if (state.failures >= state.threshold && state.state !== 'OPEN') {
    state.state = 'OPEN';
    logger.error(`Circuit breaker for ${serviceName} moved to OPEN`);
  }
};

// Proxy request to downstream service
const proxyRequest = async (req, res, serviceName, path) => {
  const correlationId = req.correlationId;
  const serviceUrl = SERVICES[serviceName];

  if (!checkCircuitBreaker(serviceName)) {
    logger.warn({
      correlationId,
      serviceName,
      message: 'Circuit breaker is OPEN'
    });
    return res.status(503).json({ 
      error: 'Service temporarily unavailable',
      serviceName 
    });
  }

  try {
    const response = await axios({
      method: req.method,
      url: `${serviceUrl}${path}`,
      headers: {
        ...req.headers,
        'x-correlation-id': correlationId,
        'x-user-id': req.user?.id
      },
      data: req.body,
      params: req.query,
      timeout: 30000
    });

    recordSuccess(serviceName);
    res.status(response.status).json(response.data);
  } catch (error) {
    recordFailure(serviceName);

    if (error.response) {
      logger.error({
        correlationId,
        serviceName,
        error: error.response.data,
        status: error.response.status
      });
      res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      logger.error({
        correlationId,
        serviceName,
        error: 'No response from service'
      });
      res.status(503).json({ error: 'Service unavailable' });
    } else {
      logger.error({
        correlationId,
        serviceName,
        error: error.message
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    circuitBreakers: circuitBreakerState
  });
});

// Auth handlers (shared by /auth and /api/auth routes)
const handleRegister = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username
        }
      }
    });

    if (authError) {
      logger.error({
        correlationId: req.correlationId,
        error: authError.message
      });
      return res.status(400).json({ error: authError.message });
    }

    // Create user profile in custom users table
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        username,
        email,
        id: authData.user.id
      })
      .select()
      .single();

    if (profileError) {
      logger.error({
        correlationId: req.correlationId,
        error: profileError.message
      });
      return res.status(500).json({ error: 'Failed to create user profile' });
    }

    let accessToken = authData.session?.access_token;
    if (!accessToken) {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError || !loginData.session?.access_token) {
        logger.error({
          correlationId: req.correlationId,
          error: loginError?.message || 'Failed to obtain access token after signup'
        });
        return res.status(500).json({ error: 'Unable to create user session' });
      }
      accessToken = loginData.session.access_token;
    }

    logger.info({
      correlationId: req.correlationId,
      userId: profileData.id,
      message: 'User registered successfully'
    });

    res.json({ token: accessToken, userId: profileData.id, username: profileData.username, email: profileData.email });
  } catch (error) {
    logger.error({
      correlationId: req.correlationId,
      error: error.message
    });
    res.status(500).json({ error: 'Registration failed' });
  }
};

const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Login with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.session?.access_token) {
      logger.error({
        correlationId: req.correlationId,
        error: authError?.message || 'Invalid credentials'
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user profile from custom users table
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      logger.error({
        correlationId: req.correlationId,
        error: profileError.message
      });
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    const accessToken = authData.session.access_token;

    logger.info({
      correlationId: req.correlationId,
      userId: profileData.id,
      message: 'User logged in successfully'
    });

    res.json({ token: accessToken, userId: profileData.id, username: profileData.username, email: profileData.email });
  } catch (error) {
    logger.error({
      correlationId: req.correlationId,
      error: error.message
    });
    res.status(500).json({ error: 'Login failed' });
  }
};

const handleMe = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const { user, error } = await validateSupabaseToken(token);
  if (error || !user) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  const { data: profileData, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData) {
    logger.warn({
      correlationId: req.correlationId,
      error: profileError?.message,
      message: 'Unable to fetch user profile; returning auth profile data only'
    });

    return res.json({ userId: user.id, username: user.user_metadata?.username || null, email: user.email });
  }

  res.json({ userId: profileData.id, username: profileData.username, email: profileData.email });
};

const handlePasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Prefer using the Supabase client SDK which is initialized with the service role key.
    // Use `resetPasswordForEmail` when available, otherwise fall back to the REST endpoint.
    const redirectTo = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/reset-password`
      : undefined;

    if (supabase && typeof supabase.auth?.resetPasswordForEmail === 'function') {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectTo });
      if (error) {
        logger.error({ correlationId: req.correlationId, error: error.message });
        return res.status(500).json({ error: 'Unable to process password reset request' });
      }
      return res.status(200).json({ message: 'If the email exists, password reset instructions have been sent.' });
    }

    // Fallback: call Supabase recover REST endpoint without exposing the response details.
    await axios.post(`${process.env.SUPABASE_URL}/auth/v1/recover`, {
      email,
      redirect_to: redirectTo
    }, {
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });

    return res.status(200).json({ message: 'If the email exists, password reset instructions have been sent.' });
  } catch (error) {
    logger.error({
      correlationId: req.correlationId,
      error: error.message
    });
    return res.status(500).json({ error: 'Unable to process password reset request' });
  }
};

// Auth endpoints (both /auth and /api/auth for frontend compatibility)
app.post('/auth/register', handleRegister);
app.post('/api/auth/register', handleRegister);
app.post('/auth/login', handleLogin);
app.post('/api/auth/login', handleLogin);
app.post('/auth/reset-password', handlePasswordReset);
app.post('/api/auth/reset-password', handlePasswordReset);
app.get('/auth/me', handleMe);
app.get('/api/auth/me', handleMe);

// Problem Service routes
app.get('/api/auth/codeforces/problems', (req, res) => {
  proxyRequest(req, res, 'problemService', '/auth/codeforces/problems');
});

app.get('/api/auth/codeforces/problems/:slug', (req, res) => {
  proxyRequest(req, res, 'problemService', `/auth/codeforces/problems/${req.params.slug}`);
});

app.get('/api/auth/kattis/problems', (req, res) => {
  proxyRequest(req, res, 'problemService', '/auth/kattis/problems');
});

app.get('/api/auth/kattis/problems/:slug', (req, res) => {
  proxyRequest(req, res, 'problemService', `/auth/kattis/problems/${req.params.slug}`);
});

app.get('/api/mock/problems', authenticateToken, (req, res) => {
  proxyRequest(req, res, 'problemService', '/mock/problems');
});

app.get('/api/mock/problems/:id', authenticateToken, (req, res) => {
  proxyRequest(req, res, 'problemService', `/mock/problems/${req.params.id}`);
});

app.get('/api/problems', authenticateToken, rateLimiter, (req, res) => {
  proxyRequest(req, res, 'problemService', '/problems');
});

app.get('/api/problems/published', authenticateToken, rateLimiter, (req, res) => {
  proxyRequest(req, res, 'problemService', '/problems/published');
});

app.get('/api/problems/search', authenticateToken, rateLimiter, (req, res) => {
  proxyRequest(req, res, 'problemService', '/problems/search');
});

app.get('/api/problems/slug/:slug', authenticateToken, (req, res) => {
  proxyRequest(req, res, 'problemService', `/problems/slug/${req.params.slug}`);
});

app.get('/api/problems/:id', authenticateToken, (req, res) => {
  proxyRequest(req, res, 'problemService', `/problems/${req.params.id}`);
});

// Submission Service routes
app.post('/api/submissions', authenticateToken, rateLimiter, (req, res) => {
  proxyRequest(req, res, 'submissionService', '/submissions');
});

app.get('/api/submissions/:id', authenticateToken, (req, res) => {
  proxyRequest(req, res, 'submissionService', `/submissions/${req.params.id}`);
});

app.get('/api/submissions', authenticateToken, (req, res) => {
  proxyRequest(req, res, 'submissionService', '/submissions');
});

// Contest Service routes
app.post('/api/contests', authenticateToken, (req, res) => {
  proxyRequest(req, res, 'contestService', '/contests');
});

app.get('/api/contests', authenticateToken, (req, res) => {
  proxyRequest(req, res, 'contestService', '/contests');
});

app.get('/api/contests/:id', authenticateToken, (req, res) => {
  proxyRequest(req, res, 'contestService', `/contests/${req.params.id}`);
});

app.get('/api/contests/slug/:slug', authenticateToken, (req, res) => {
  proxyRequest(req, res, 'contestService', `/contests/slug/${req.params.slug}`);
});

app.get('/api/contests/status/:status', authenticateToken, (req, res) => {
  proxyRequest(req, res, 'contestService', `/contests/status/${req.params.status}`);
});

app.get('/api/contests/active', authenticateToken, (req, res) => {
  proxyRequest(req, res, 'contestService', '/contests/active');
});

app.put('/api/contests/:id', authenticateToken, (req, res) => {
  proxyRequest(req, res, 'contestService', `/contests/${req.params.id}`);
});

app.delete('/api/contests/:id', authenticateToken, (req, res) => {
  proxyRequest(req, res, 'contestService', `/contests/${req.params.id}`);
});

app.get('/api/contests/:id/leaderboard', authenticateToken, (req, res) => {
  proxyRequest(req, res, 'contestService', `/contests/${req.params.id}/leaderboard`);
});

app.get('/api/contests/:id/leaderboard/:userId', authenticateToken, (req, res) => {
  proxyRequest(req, res, 'contestService', `/contests/${req.params.id}/leaderboard/${req.params.userId}`);
});

app.post('/api/contests/:id/leaderboard', authenticateToken, (req, res) => {
  proxyRequest(req, res, 'contestService', `/contests/${req.params.id}/leaderboard`);
});

app.delete('/api/contests/:id/leaderboard', authenticateToken, (req, res) => {
  proxyRequest(req, res, 'contestService', `/contests/${req.params.id}/leaderboard`);
});

// AI Review Service routes
app.post('/api/ai/review', authenticateToken, rateLimiter, (req, res) => {
  proxyRequest(req, res, 'aiReviewService', '/review');
});

app.post('/api/ai/plagiarism', authenticateToken, rateLimiter, (req, res) => {
  proxyRequest(req, res, 'aiReviewService', '/plagiarism');
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    correlationId: req.correlationId,
    error: err.message,
    stack: err.stack
  });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info('Connected to services:', SERVICES);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await redisStore.quit();
  process.exit(0);
});