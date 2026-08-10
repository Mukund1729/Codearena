const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const amqp = require('amqplib');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
require('dotenv').config();

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/websocket-service.log' })
  ]
});

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// RabbitMQ connection
let rabbitmqChannel;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const RESULT_EXCHANGE = 'codearena.results';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// JWT Secret is no longer required for Supabase token validation, but kept for compatibility
const JWT_SECRET = process.env.JWT_SECRET || 'codearena-secret-key-2024';

// Store connected users: { userId: { socketId, contestId } }
const connectedUsers = new Map();

// Store contest rooms: { contestId: Set of socketIds }
const contestRooms = new Map();

// Connect to RabbitMQ
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    rabbitmqChannel = await connection.createChannel();

    // Assert result exchange
    await rabbitmqChannel.assertExchange(RESULT_EXCHANGE, 'fanout', {
      durable: true
    });

    // Create a temporary queue for this service
    const queue = await rabbitmqChannel.assertQueue('', { exclusive: true });
    
    // Bind queue to result exchange
    await rabbitmqChannel.bindQueue(queue.queue, RESULT_EXCHANGE, '');

    // Consume messages
    rabbitmqChannel.consume(queue.queue, (msg) => {
      if (msg) {
        const result = JSON.parse(msg.content.toString());
        handleExecutionResult(result);
        rabbitmqChannel.ack(msg);
      }
    });

    logger.info('Connected to RabbitMQ successfully');
  } catch (error) {
    logger.warn('RabbitMQ unavailable; real-time result streaming will be disabled', error);
    rabbitmqChannel = null;
  }
}

// Handle execution result from RabbitMQ
async function handleExecutionResult(result) {
  try {
    const { submissionId, status, userId, contestId } = result;

    logger.info({
      submissionId,
      status,
      userId,
      message: 'Received execution result'
    });

    // Send result to specific user
    if (connectedUsers.has(userId)) {
      const userData = connectedUsers.get(userId);
      io.to(userData.socketId).emit('submission-result', result);
      logger.info(`Sent result to user ${userId} for submission ${submissionId}`);
    }

    // If this is a contest submission and accepted, update leaderboard through contest-service
    if (contestId && status === 'ACCEPTED') {
      await updateLeaderboard(contestId, userId, submissionId);
    }

  } catch (error) {
    logger.error('Error handling execution result:', error);
  }
}

// Update leaderboard through contest service and notify contest participants
const CONTEST_SERVICE_URL = process.env.CONTEST_SERVICE_URL || 'http://contest-service:3005';

async function updateLeaderboard(contestId, userId, submissionId) {
  try {
    const updateUrl = `${CONTEST_SERVICE_URL}/contests/${contestId}/leaderboard`;
    await axios.post(updateUrl, { userId, score: 10 }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const leaderboardRes = await axios.get(`${CONTEST_SERVICE_URL}/contests/${contestId}/leaderboard`);
    const leaderboard = leaderboardRes.data;
    if (contestRooms.has(contestId)) {
      const roomSockets = contestRooms.get(contestId);
      roomSockets.forEach(socketId => {
        io.to(socketId).emit('leaderboard-updated', {
          contestId,
          leaderboard: leaderboard.map((entry, index) => ({
            rank: index + 1,
            userId: entry.userId || entry.value,
            score: entry.score != null ? Math.round(entry.score) : entry.score
          }))
        });
      });
      logger.info(`Leaderboard update dispatched for contest ${contestId}`);
    }
  } catch (error) {
    logger.error('Error updating leaderboard via contest-service:', error);
  }
}

async function validateSupabaseToken(token) {
  try {
    const response = await axios.get(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
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

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error'));
    }

    const { user, error } = await validateSupabaseToken(token);
    if (error || !user) {
      logger.error('Socket authentication error: invalid token', error);
      return next(new Error('Authentication error'));
    }

    socket.userId = user.id;
    socket.username = user.user_metadata?.username || user.email || user.id;
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  const userId = socket.userId;
  const username = socket.username;

  logger.info(`User connected: ${username} (${userId})`);

  // Store user connection
  connectedUsers.set(userId, {
    socketId: socket.id,
    contestId: null
  });

  // Join contest room
  socket.on('join-contest', async (contestId) => {
    try {
      socket.join(`contest:${contestId}`);
      
      // Update user data
      if (connectedUsers.has(userId)) {
        const userData = connectedUsers.get(userId);
        userData.contestId = contestId;
        connectedUsers.set(userId, userData);
      }

      // Add to contest room tracking
      if (!contestRooms.has(contestId)) {
        contestRooms.set(contestId, new Set());
      }
      contestRooms.get(contestId).add(socket.id);

      // Send current leaderboard to user
      try {
        const leaderboardRes = await axios.get(`${CONTEST_SERVICE_URL}/contests/${contestId}/leaderboard`);
        const leaderboard = leaderboardRes.data;
        socket.emit('leaderboard-updated', {
          contestId,
          leaderboard: leaderboard.map((entry, index) => ({
            rank: index + 1,
            userId: entry.userId || entry.value,
            score: entry.score != null ? Math.round(entry.score) : entry.score
          }))
        });
      } catch (error) {
        logger.warn('Failed to fetch contest leaderboard on join:', error);
      }

      logger.info(`User ${username} joined contest ${contestId}`);
    } catch (error) {
      logger.error('Error joining contest:', error);
    }
  });

  // Leave contest room
  socket.on('leave-contest', (contestId) => {
    socket.leave(`contest:${contestId}`);
    
    // Update user data
    if (connectedUsers.has(userId)) {
      const userData = connectedUsers.get(userId);
      userData.contestId = null;
      connectedUsers.set(userId, userData);
    }

    // Remove from contest room tracking
    if (contestRooms.has(contestId)) {
      contestRooms.get(contestId).delete(socket.id);
    }

    logger.info(`User ${username} left contest ${contestId}`);
  });

  // Listen for submission status requests
  socket.on('subscribe-submission', (submissionId) => {
    socket.join(`submission:${submissionId}`);
    logger.info(`User ${username} subscribed to submission ${submissionId}`);
  });

  socket.on('unsubscribe-submission', (submissionId) => {
    socket.leave(`submission:${submissionId}`);
    logger.info(`User ${username} unsubscribed from submission ${submissionId}`);
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${username} (${userId})`);

    // Remove user connection
    const userData = connectedUsers.get(userId);
    if (userData && userData.contestId) {
      // Remove from contest room
      if (contestRooms.has(userData.contestId)) {
        contestRooms.get(userData.contestId).delete(socket.id);
      }
    }
    connectedUsers.delete(userId);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connectedUsers: connectedUsers.size,
    rabbitmq: rabbitmqChannel ? 'connected' : 'disconnected',
  });
});

// Get connected users count
app.get('/stats', (req, res) => {
  res.json({
    connectedUsers: connectedUsers.size,
    contestRooms: Object.fromEntries(
      Array.from(contestRooms.entries()).map(([id, sockets]) => [id, sockets.size])
    )
  });
});

// Start server
const PORT = process.env.PORT || 3004;

async function startServer() {
  try {
    await connectRabbitMQ();
    
    server.listen(PORT, () => {
      logger.info(`WebSocket Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  if (rabbitmqChannel) {
    await rabbitmqChannel.close();
  }
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
