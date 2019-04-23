module.exports = {
  caching: process.env.CACHING || false,
  cacheTTL: process.env.CACHE_TTL || 259200000, // 3 days
  cacheSize: process.env.CACHE_SIZE || undefined,
  redisURL: process.env.REDIS_URL || undefined,
};
