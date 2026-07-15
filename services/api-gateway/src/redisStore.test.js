const { createRedisStore } = require('./redisStore');

describe('createRedisStore', () => {
  it('stores user data in memory when Redis is unavailable', async () => {
    const store = createRedisStore(null, { error: jest.fn() });

    await store.hSet('user:1', {
      username: 'alice',
      email: 'alice@example.com'
    });

    const userData = await store.hGetAll('user:1');

    expect(userData).toEqual({
      username: 'alice',
      email: 'alice@example.com'
    });
  });

  it('tracks rate-limit entries in memory when Redis is unavailable', async () => {
    const store = createRedisStore(null, { error: jest.fn() });

    await store.zAdd('ratelimit:alice', [{ score: 100, value: '100-1' }]);

    expect(await store.zCard('ratelimit:alice')).toBe(1);
  });
});
