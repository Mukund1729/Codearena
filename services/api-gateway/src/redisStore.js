const { EventEmitter } = require('events');

function createRedisStore(redisClient, logger) {
  const memoryStore = new Map();
  const memoryZSets = new Map();

  const logError = (message, error) => {
    if (logger?.error) {
      logger.error(message, error);
    }
  };

  return {
    async hSet(key, values) {
      if (!redisClient) {
        const entry = memoryStore.get(key) || {};
        Object.assign(entry, values);
        memoryStore.set(key, entry);
        return 1;
      }

      return redisClient.hSet(key, values);
    },

    async hGetAll(key) {
      if (!redisClient) {
        return memoryStore.get(key) || {};
      }

      return redisClient.hGetAll(key);
    },

    async keys(pattern) {
      if (!redisClient) {
        return Array.from(memoryStore.keys()).filter((key) => new RegExp(pattern.replace(/\*/g, '.*')).test(key));
      }

      return redisClient.keys(pattern);
    },

    async zAdd(key, entries) {
      if (!redisClient) {
        const set = memoryZSets.get(key) || [];
        set.push(...entries);
        memoryZSets.set(key, set);
        return 1;
      }

      return redisClient.zAdd(key, entries);
    },

    async zRemRangeByScore(key, min, max) {
      if (!redisClient) {
        const set = memoryZSets.get(key) || [];
        const filtered = set.filter((entry) => entry.score < min || entry.score > max);
        memoryZSets.set(key, filtered);
        return filtered.length;
      }

      return redisClient.zRemRangeByScore(key, min, max);
    },

    async zCard(key) {
      if (!redisClient) {
        return (memoryZSets.get(key) || []).length;
      }

      return redisClient.zCard(key);
    },

    async expire(key, seconds) {
      if (!redisClient) {
        return 1;
      }

      return redisClient.expire(key, seconds);
    },

    async quit() {
      if (redisClient?.quit) {
        return redisClient.quit();
      }
      return true;
    }
  };
}

module.exports = { createRedisStore };
