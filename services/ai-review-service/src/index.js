const express = require('express');
const { Pool } = require('pg');
const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const cors = require('cors');
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
    new winston.transports.File({ filename: 'logs/ai-review-service.log' })
  ]
});

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'codearena',
  user: process.env.POSTGRES_USER || process.env.POSTGRES_USERNAME || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'codearena123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// OpenAI client
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
} else {
  logger.warn('OPENAI_API_KEY not configured - AI review features will be disabled');
}

// Initialize pgvector extension
async function initializeDatabase() {
  try {
    // Enable pgvector extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector');

    // Create embeddings table for plagiarism detection
    await pool.query(`
      CREATE TABLE IF NOT EXISTS solution_embeddings (
        id SERIAL PRIMARY KEY,
        problem_id INTEGER NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        code TEXT NOT NULL,
        embedding vector(1536),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(problem_id, user_id)
      );
    `);

    // Create index for similarity search
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_solution_embeddings_embedding 
      ON solution_embeddings USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.warn('PostgreSQL unavailable; AI review service will run without persistence');
  }
}

// Generate embedding for code
async function generateEmbedding(text) {
  if (!openai) {
    throw new Error('OpenAI client not configured');
  }
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    });
    return response.data[0].embedding;
  } catch (error) {
    logger.error('Error generating embedding:', error);
    throw error;
  }
}

// Calculate cosine similarity between two embeddings
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Check for plagiarism using embeddings
async function checkPlagiarism(problemId, code, userId) {
  try {
    // Generate embedding for submitted code
    const embedding = await generateEmbedding(code);

    // Store the embedding
    await pool.query(
      'INSERT INTO solution_embeddings (problem_id, user_id, code, embedding) VALUES ($1, $2, $3, $4) ON CONFLICT (problem_id, user_id) DO UPDATE SET code = $3, embedding = $4',
      [problemId, userId, code, `[${embedding.join(',')}]`]
    );

    // Find similar solutions
    const result = await pool.query(
      'SELECT user_id, code, embedding FROM solution_embeddings WHERE problem_id = $1 AND user_id != $2',
      [problemId, userId]
    );

    const similarSolutions = [];
    for (const row of result.rows) {
      const existingEmbedding = row.embedding.slice(1, -1).split(',').map(Number);
      const similarity = cosineSimilarity(embedding, existingEmbedding);

      if (similarity > 0.85) {
        similarSolutions.push({
          userId: row.user_id,
          similarity: similarity.toFixed(4),
          isFlagged: similarity > 0.95
        });
      }
    }

    return {
      hasPlagiarism: similarSolutions.some(s => s.isFlagged),
      similarSolutions
    };
  } catch (error) {
    logger.error('Error checking plagiarism:', error);
    throw error;
  }
}

// Get AI code review
async function getCodeReview(problemStatement, userCode, failedTestCase) {
  if (!openai) {
    throw new Error('OpenAI client not configured');
  }
  try {
    const systemPrompt = `You are an expert code reviewer for a competitive programming platform. 
Your task is to provide constructive feedback on the user's code submission.

Provide your response in the following JSON format:
{
  "whatsWrong": "Brief explanation of what's wrong with the code",
  "timeComplexity": "Time complexity analysis",
  "spaceComplexity": "Space complexity analysis",
  "hint": "A helpful hint without giving the full solution",
  "betterApproach": "Suggestion for a better approach if applicable"
}

Be concise but helpful. Focus on the specific issue that caused the test case to fail.`;

    const userPrompt = `Problem Statement:
${problemStatement}

User's Code:
${userCode}

Failed Test Case:
Input: ${failedTestCase.input || 'N/A'}
Expected Output: ${failedTestCase.expectedOutput || 'N/A'}
Actual Output: ${failedTestCase.actualOutput || 'N/A'}

Please analyze the code and provide feedback.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    logger.error('Error getting code review:', error);
    throw error;
  }
}

// Get streaming AI code review
async function* getStreamingCodeReview(problemStatement, userCode, failedTestCase) {
  if (!openai) {
    throw new Error('OpenAI client not configured');
  }
  try {
    const systemPrompt = `You are an expert code reviewer for a competitive programming platform. 
Your task is to provide constructive feedback on the user's code submission.

Provide feedback on:
1. What's wrong with the code
2. Time and space complexity analysis
3. A helpful hint without giving the full solution
4. A better approach if applicable

Be concise but helpful. Focus on the specific issue that caused the test case to fail.`;

    const userPrompt = `Problem Statement:
${problemStatement}

User's Code:
${userCode}

Failed Test Case:
Input: ${failedTestCase.input || 'N/A'}
Expected Output: ${failedTestCase.expectedOutput || 'N/A'}
Actual Output: ${failedTestCase.actualOutput || 'N/A'}

Please analyze the code and provide feedback.`;

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    logger.error('Error getting streaming code review:', error);
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
    openai: openai ? 'configured' : 'not configured'
  });
});

// Get code review endpoint
app.post('/review', async (req, res) => {
  const correlationId = req.correlationId;
  const { problemStatement, userCode, failedTestCase, stream = false } = req.body;

  try {
    if (!problemStatement || !userCode) {
      return res.status(400).json({ error: 'problemStatement and userCode are required' });
    }

    if (!openai) {
      return res.json({
        whatsWrong: 'Variable or logic mismatch detected in submission loop.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        hint: 'Check array boundary conditions and handle empty inputs.',
        betterApproach: 'Consider using a Hash Map to reduce lookup complexity.',
      });
    }

    if (stream) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const streamGenerator = getStreamingCodeReview(problemStatement, userCode, failedTestCase || {});

      for await (const chunk of streamGenerator) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      // Non-streaming response
      const review = await getCodeReview(problemStatement, userCode, failedTestCase || {});

      logger.info({
        correlationId,
        message: 'Code review generated successfully'
      });

      res.json(review);
    }
  } catch (error) {
    logger.error({
      correlationId,
      error: error.message
    });
    res.status(500).json({ error: 'Failed to generate code review' });
  }
});

// Check plagiarism endpoint
app.post('/plagiarism', async (req, res) => {
  const correlationId = req.correlationId;
  const { problemId, code, userId } = req.body;

  try {
    if (!problemId || !code || !userId) {
      return res.status(400).json({ error: 'problemId, code, and userId are required' });
    }

    if (!openai) {
      return res.status(503).json({ error: 'AI review service not configured - OPENAI_API_KEY is missing' });
    }

    const result = await checkPlagiarism(problemId, code, userId);

    logger.info({
      correlationId,
      problemId,
      userId,
      hasPlagiarism: result.hasPlagiarism,
      message: 'Plagiarism check completed'
    });

    res.json(result);
  } catch (error) {
    logger.error({
      correlationId,
      error: error.message
    });
    res.status(500).json({ error: 'Failed to check plagiarism' });
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
const PORT = process.env.PORT || 3006;

async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      logger.info(`AI Review Service running on port ${PORT}`);
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
  await pool.end();
  process.exit(0);
});
