const express = require('express');
const amqp = require('amqplib');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const Joi = require('joi');
const { createSubmissionStore } = require('./submissionStore');
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
    new winston.transports.File({ filename: 'logs/submission-service.log' })
  ]
});

// Initialize Express app
const app = express();
app.use(express.json({ limit: '1MB' }));

// PostgreSQL connection
let pool;
try {
  pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'codearena',
    user: process.env.POSTGRES_USER || 'codearena',
    password: process.env.POSTGRES_PASSWORD || 'codearena123',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
} catch (error) {
  logger.error('Failed to initialize PostgreSQL pool:', error);
  pool = null;
}

const submissionStore = createSubmissionStore();

// RabbitMQ connection
let rabbitmqChannel;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const SUBMISSION_QUEUE = 'codearena.submissions';
const RESULT_EXCHANGE = 'codearena.results';

// Supported languages and their constraints
const SUPPORTED_LANGUAGES = {
  python: {
    extensions: ['.py'],
    maxSize: 1024 * 100, // 100KB
    image: 'python:3.11-slim'
  },
  java: {
    extensions: ['.java'],
    maxSize: 1024 * 200, // 200KB
    image: 'openjdk:17-slim'
  },
  cpp: {
    extensions: ['.cpp', '.cc', '.cxx'],
    maxSize: 1024 * 200, // 200KB
    image: 'gcc:12'
  },
  javascript: {
    extensions: ['.js'],
    maxSize: 1024 * 150, // 150KB
    image: 'node:18-slim'
  }
};

// Validation schema
const submissionSchema = Joi.object({
  problemId: Joi.number().integer().positive().required(),
  language: Joi.string().valid('python', 'java', 'cpp', 'javascript').required(),
  code: Joi.string().max(1024 * 200).required(),
  userId: Joi.string().required(),
  contestId: Joi.number().integer().positive().optional()
});

// Initialize database tables
async function initializeDatabase() {
  if (!pool) {
    logger.warn('PostgreSQL unavailable; using in-memory submissions store');
    return;
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        submission_id VARCHAR(36) UNIQUE NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        problem_id INTEGER NOT NULL,
        contest_id INTEGER,
        language VARCHAR(50) NOT NULL,
        code TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        result VARCHAR(50),
        error_message TEXT,
        execution_time INTEGER,
        memory_used INTEGER,
        test_cases_passed INTEGER,
        total_test_cases INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (problem_id) REFERENCES problems(id),
        FOREIGN KEY (contest_id) REFERENCES contests(id)
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_submissions_user_problem 
      ON submissions(user_id, problem_id, status);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_submissions_contest 
      ON submissions(contest_id, status);
    `);

    logger.info('Database tables initialized successfully');
  } catch (error) {
    logger.warn('PostgreSQL unavailable; using in-memory submissions store');
  }
}

// Connect to RabbitMQ
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    rabbitmqChannel = await connection.createChannel();

    // Assert submission queue
    await rabbitmqChannel.assertQueue(SUBMISSION_QUEUE, {
      durable: true,
      maxLength: 10000
    });

    // Assert result exchange
    await rabbitmqChannel.assertExchange(RESULT_EXCHANGE, 'fanout', {
      durable: true
    });

    logger.info('Connected to RabbitMQ successfully');
  } catch (error) {
    logger.warn('RabbitMQ unavailable; submissions will be stored locally until messaging is available');
    rabbitmqChannel = null;
  }
}

// Validate language and code
function validateSubmission(language, code) {
  const langConfig = SUPPORTED_LANGUAGES[language];
  
  if (!langConfig) {
    throw new Error(`Unsupported language: ${language}`);
  }

  if (code.length > langConfig.maxSize) {
    throw new Error(`Code size exceeds maximum limit of ${langConfig.maxSize} bytes`);
  }

  return langConfig;
}

// Create submission record
async function createSubmissionRecord(submissionData) {
  const {
    submissionId,
    userId,
    problemId,
    contestId,
    language,
    code
  } = submissionData;

  if (!pool) {
    return submissionStore.create({
      submissionId,
      userId,
      problemId,
      contestId,
      language,
      code,
      status: 'PENDING'
    });
  }

  const query = `
    INSERT INTO submissions 
    (submission_id, user_id, problem_id, contest_id, language, code, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
    RETURNING id, created_at
  `;

  const values = [submissionId, userId, problemId, contestId, language, code];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.warn('Database unavailable; storing submission locally instead');
    return submissionStore.create({
      submissionId,
      userId,
      problemId,
      contestId,
      language,
      code,
      status: 'PENDING'
    });
  }
}

// Publish job to RabbitMQ
async function publishExecutionJob(jobData) {
  if (!rabbitmqChannel) {
    logger.info({ submissionId: jobData.submissionId, message: 'RabbitMQ unavailable; job queued in memory only' });
    return;
  }

  try {
    const message = JSON.stringify(jobData);
    rabbitmqChannel.sendToQueue(SUBMISSION_QUEUE, Buffer.from(message), {
      persistent: true,
      contentType: 'application/json'
    });

    logger.info({
      submissionId: jobData.submissionId,
      message: 'Job published to execution queue'
    });
  } catch (error) {
    logger.error('Error publishing job to RabbitMQ:', error);
    throw error;
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
    userId: req.headers['x-user-id']
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    rabbitmq: rabbitmqChannel ? 'connected' : 'disconnected'
  });
});

// Create submission endpoint
app.post('/submissions', async (req, res) => {
  const correlationId = req.correlationId;
  const userId = req.headers['x-user-id'];

  try {
    // Validate request body
    const { error, value } = submissionSchema.validate({
      ...req.body,
      userId: userId || req.body.userId
    });

    if (error) {
      logger.warn({
        correlationId,
        error: 'Validation error',
        details: error.details
      });
      return res.status(400).json({ error: error.details[0].message });
    }

    const { problemId, language, code, contestId } = value;

    // Validate language and code
    validateSubmission(language, code);

    // Generate submission ID
    const submissionId = uuidv4();

    // Create submission record in database
    const dbRecord = await createSubmissionRecord({
      submissionId,
      userId,
      problemId,
      contestId,
      language,
      code
    });

    // Publish job to RabbitMQ
    await publishExecutionJob({
      submissionId,
      userId,
      problemId,
      contestId,
      language,
      code,
      dockerImage: SUPPORTED_LANGUAGES[language].image,
      timestamp: new Date().toISOString()
    });

    logger.info({
      correlationId,
      submissionId,
      userId,
      problemId,
      message: 'Submission created successfully'
    });

    res.status(201).json({
      submissionId,
      status: 'PENDING',
      createdAt: dbRecord.created_at,
      message: 'Submission queued for execution'
    });

  } catch (error) {
    logger.error({
      correlationId,
      error: error.message,
      stack: error.stack
    });

    if (error.message.includes('Unsupported language') || 
        error.message.includes('exceeds maximum limit')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get submission by ID endpoint
app.get('/submissions/:submissionId', async (req, res) => {
  const correlationId = req.correlationId;
  const { submissionId } = req.params;

  try {
    if (!pool) {
      const submission = await submissionStore.getById(submissionId);
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      return res.json({
        submissionId: submission.submissionId,
        userId: submission.userId,
        problemId: submission.problemId,
        contestId: submission.contestId,
        language: submission.language,
        status: submission.status,
        result: submission.result,
        errorMessage: submission.errorMessage,
        executionTime: submission.executionTime,
        memoryUsed: submission.memoryUsed,
        testCasesPassed: submission.testCasesPassed,
        totalTestCases: submission.totalTestCases,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt
      });
    }

    const query = `
      SELECT * FROM submissions 
      WHERE submission_id = $1
    `;

    const result = await pool.query(query, [submissionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submission = result.rows[0];

    logger.info({
      correlationId,
      submissionId,
      status: submission.status,
      message: 'Submission retrieved successfully'
    });

    res.json({
      submissionId: submission.submission_id,
      userId: submission.user_id,
      problemId: submission.problem_id,
      contestId: submission.contest_id,
      language: submission.language,
      status: submission.status,
      result: submission.result,
      errorMessage: submission.error_message,
      executionTime: submission.execution_time,
      memoryUsed: submission.memory_used,
      testCasesPassed: submission.test_cases_passed,
      totalTestCases: submission.total_test_cases,
      createdAt: submission.created_at,
      updatedAt: submission.updated_at
    });

  } catch (error) {
    logger.error({
      correlationId,
      submissionId,
      error: error.message
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user submissions endpoint
app.get('/submissions', async (req, res) => {
  const correlationId = req.correlationId;
  const userId = req.headers['x-user-id'];
  const { problemId, limit = 20, offset = 0 } = req.query;

  try {
    if (!pool) {
      const submissions = await submissionStore.listByUser(userId);
      return res.json({
        submissions: submissions.map((submission) => ({
          submissionId: submission.submissionId,
          problemId: submission.problemId,
          contestId: submission.contestId,
          language: submission.language,
          status: submission.status,
          result: submission.result,
          createdAt: submission.createdAt
        })),
        total: submissions.length
      });
    }

    let query = `
      SELECT * FROM submissions 
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramCount = 1;

    if (problemId) {
      paramCount++;
      query += ` AND problem_id = $${paramCount}`;
      params.push(problemId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    logger.info({
      correlationId,
      userId,
      count: result.rows.length,
      message: 'User submissions retrieved successfully'
    });

    res.json({
      submissions: result.rows.map(row => ({
        submissionId: row.submission_id,
        problemId: row.problem_id,
        contestId: row.contest_id,
        language: row.language,
        status: row.status,
        result: row.result,
        createdAt: row.created_at
      })),
      total: result.rows.length
    });

  } catch (error) {
    logger.error({
      correlationId,
      userId,
      error: error.message
    });
    res.status(500).json({ error: 'Internal server error' });
  }
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
const PORT = process.env.PORT || 3002;

async function startServer() {
  try {
    await initializeDatabase();
    await connectRabbitMQ();

    app.listen(PORT, () => {
      logger.info(`Submission Service running on port ${PORT}`);
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
  if (pool) {
    await pool.end();
  }
  if (rabbitmqChannel) {
    await rabbitmqChannel.close();
  }
  process.exit(0);
});
