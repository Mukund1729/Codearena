-- CodeArena Redis Initialization Script
-- This script initializes Redis data structures

-- Rate limiting keys (will be created dynamically)
-- Format: ratelimit:{userId}

-- Leaderboard keys (will be created dynamically)
-- Format: contest:{contestId}:leaderboard
-- Data type: Sorted Set (ZSET)
-- Member: userId
-- Score: total points

-- Submission status cache (will be created dynamically)
-- Format: submission:{submissionId}
-- Data type: Hash
-- Fields: status, result, userId, problemId
-- TTL: 300 seconds (5 minutes)

-- Session tokens (will be created dynamically)
-- Format: session:{userId}
-- Data type: String
-- TTL: 86400 seconds (24 hours)

-- Example: Initialize a sample leaderboard
redis.call('ZADD', 'contest:1:leaderboard', 100, 'user-1', 85, 'user-2', 90, 'user-3')
redis.call('EXPIRE', 'contest:1:leaderboard', 86400)

print('Redis initialization completed')
