// CodeArena MongoDB Database Schema
// This script initializes collections for execution logs

db = db.getSiblingDB('codearena');

// Execution logs collection
db.createCollection('execution_logs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['submissionId', 'userId', 'problemId', 'language'],
      properties: {
        submissionId: { bsonType: 'string' },
        userId: { bsonType: 'string' },
        problemId: { bsonType: 'number' },
        contestId: { bsonType: 'number' },
        language: { bsonType: 'string' },
        status: { bsonType: 'string' },
        result: { bsonType: 'string' },
        testCases: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              testCaseNumber: { bsonType: 'number' },
              status: { bsonType: 'string' },
              input: { bsonType: 'string' },
              expectedOutput: { bsonType: 'string' },
              actualOutput: { bsonType: 'string' },
              executionTime: { bsonType: 'number' },
              memoryUsed: { bsonType: 'number' },
              stderr: { bsonType: 'string' }
            }
          }
        },
        executionTime: { bsonType: 'number' },
        memoryUsed: { bsonType: 'number' },
        errorMessage: { bsonType: 'string' },
        containerId: { bsonType: 'string' },
        dockerImage: { bsonType: 'string' },
        createdAt: { bsonType: 'date' },
        completedAt: { bsonType: 'date' }
      }
    }
  }
});

// Create indexes for execution logs
db.execution_logs.createIndex({ submissionId: 1 }, { unique: true });
db.execution_logs.createIndex({ userId: 1, createdAt: -1 });
db.execution_logs.createIndex({ problemId: 1, createdAt: -1 });
db.execution_logs.createIndex({ contestId: 1, createdAt: -1 });
db.execution_logs.createIndex({ status: 1 });
db.execution_logs.createIndex({ result: 1 });
db.execution_logs.createIndex({ createdAt: -1 });

// Performance metrics collection
db.createCollection('performance_metrics', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['submissionId', 'metricType'],
      properties: {
        submissionId: { bsonType: 'string' },
        metricType: { bsonType: 'string', enum: ['container_spinup', 'execution', 'total'] },
        value: { bsonType: 'number' },
        unit: { bsonType: 'string' },
        language: { bsonType: 'string' },
        timestamp: { bsonType: 'date' }
      }
    }
  }
});

// Create indexes for performance metrics
db.performance_metrics.createIndex({ submissionId: 1 });
db.performance_metrics.createIndex({ metricType: 1 });
db.performance_metrics.createIndex({ language: 1 });
db.performance_metrics.createIndex({ timestamp: -1 });

print('MongoDB collections and indexes created successfully');
