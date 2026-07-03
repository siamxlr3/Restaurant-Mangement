/**
 * Redis client interface mock
 * Handles cache invalidations safely without crashing during startup.
 */
const mockRedis = {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 1,
    keys: async () => [],
};

const invalidateCache = async (key) => {
    console.log(`[REDIS CACHE INVALIDATION] Invalidating key: ${key}`);
    return true;
};

module.exports = {
    redisClient: mockRedis,
    invalidateCache,
};
