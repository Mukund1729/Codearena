const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const amqp = require('amqplib');
const redis = require('redis');
const jwt = require('jsonwebtoken');
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

// Redis client for leaderboard and caching
let redisClient = null;
try {
  redisClient = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    },
    password: process.env.REDIS_PASSWORD
  });

  redisClient.on('error', () => {
    logger.warn('Redis unavailable; leaderboard updates will be disabled');
  });

  redisClient.connect().catch(err => {
    logger.warn('Redis unavailable; leaderboard updates will be disabled', err);
    redisClient = null;
  });
} catch (error) {
  logger.warn('Redis unavailable; leaderboard updates will be disabled', error);
  redisClient = null;
}

// RabbitMQ connection
let rabbitmqChannel;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const RESULT_EXCHANGE = 'codearena.results';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

    // If this is a contest submission and accepted, update leaderboard
    if (contestId && status === 'ACCEPTED') {
      await updateLeaderboard(contestId, userId, submissionId);
    }

  } catch (error) {
    logger.error('Error handling execution result:', error);
  }
}

// Update leaderboard in Redis and notify contest participants
async function updateLeaderboard(contestId, userId, submissionId) {
  try {
    // Increment user score in Redis sorted set
    if (!redisClient) {
      return;
    }

    const leaderboardKey = `contest:${contestId}:leaderboard`;
    await redisClient.zIncrBy(leaderboardKey, 10, userId); // 10 points per accepted submission

    // Get updated leaderboard
    const leaderboard = await redisClient.zRevRangeWithScores(
      leaderboardKey,
      0,
      -1,
      'WITHSCORES'
    );

    // Emit leaderboard update to all users in contest room
    if (contestRooms.has(contestId)) {
      const roomSockets = contestRooms.get(contestId);
      roomSockets.forEach(socketId => {
        io.to(socketId).emit('leaderboard-updated', {
          contestId,
          leaderboard: leaderboard.map((entry, index) => ({
            rank: index + 1,
            userId: entry.value,
            score: Math.round(entry.score)
          }))
        });
      });
      logger.info(`Leaderboard updated for contest ${contestId}`);
    }

  } catch (error) {
    logger.error('Error updating leaderboard:', error);
  }
}

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    socket.username = decoded.username;
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
      if (redisClient) {
        const leaderboardKey = `contest:${contestId}:leaderboard`;
        const leaderboard = await redisClient.zRevRangeWithScores(
          leaderboardKey,
          0,
          -1,
          'WITHSCORES'
        );

        socket.emit('leaderboard-updated', {
          contestId,
          leaderboard: leaderboard.map((entry, index) => ({
            rank: index + 1,
            userId: entry.value,
            score: Math.round(entry.score)
          }))
        });
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
    redis: redisClient?.isOpen ? 'connected' : 'disconnected'
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
  await redisClient.quit();
  if (rabbitmqChannel) {
    await rabbitmqChannel.close();
  }
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
