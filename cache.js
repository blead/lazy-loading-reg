const { caching, cacheTTL, cacheSize, redisURL } = require('./config');

class Cache {
  constructor({ type, ttl, size }) {
    this.type = type;
    this.ttl = ttl;
    this.size = size;
    if (type === 'memory') {
      const TTLMemCache = require('ttl-mem-cache');
      this._cache = new TTLMemCache({ ttl });
    } else if (type === 'redis') {
      const redis = require('redis');
      const { promisify } = require('util');
      this._redis = redis.createClient(redisURL, {
        socket_keepalive: false,
      });
      this._redis.getPromise = promisify(this._redis.get).bind(this._redis);
    }
  }
  /* returns Promise */
  get(key) {
    if (this.type === 'memory') {
      return Promise.resolve(this._cache.get(key));
    } else if (this.type === 'redis') {
      return this._redis.getPromise(key);
    }
    return Promise.resolve(null);
  }
  set(key, value) {
    if (this.type === 'memory') {
      this._cache.set(key, value);
      if (this.size && this._cache.length > this.size) {
        this._cache.prune();
      }
    } else if (this.type === 'redis') {
      this._redis.set(key, value, 'PX', this.ttl);
    }
  }
}

module.exports = {
  cache: new Cache({ type: caching, ttl: cacheTTL, size: cacheSize }),
};
