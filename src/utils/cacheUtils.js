// Cache configuration from environment variables
const DEFAULT_TTL = parseInt(process.env.REACT_APP_CACHE_TTL) || 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = parseInt(process.env.REACT_APP_CACHE_MAX_SIZE) || 1000;

class CacheManager {
  constructor() {
    this.caches = new Map();
  }

  // Initialize a new cache store with configuration
  initializeCache(storeName, config = {}) {
    if (this.caches.has(storeName)) {
      return;
    }

    this.caches.set(storeName, {
      data: new Map(),
      config: {
        ttl: config.ttl || DEFAULT_TTL,
        maxSize: config.maxSize || MAX_CACHE_SIZE,
        ...config
      }
    });
  }

  // Get an item from cache
  get(storeName, key) {
    this.ensureCacheExists(storeName);
    const cache = this.caches.get(storeName);
    const item = cache.data.get(this.getCacheKey(key));

    if (!item) {
      return null;
    }

    if (this.isExpired(item)) {
      this.delete(storeName, key);
      return null;
    }

    return item.value;
  }

  // Set an item in cache
  set(storeName, key, value, ttl) {
    this.ensureCacheExists(storeName);
    const cache = this.caches.get(storeName);
    const cacheKey = this.getCacheKey(key);

    // Enforce cache size limit
    if (cache.data.size >= cache.config.maxSize) {
      this.evictOldest(storeName);
    }

    cache.data.set(cacheKey, {
      value,
      timestamp: Date.now(),
      ttl: ttl || cache.config.ttl
    });

    return true;
  }

  // Delete an item from cache
  delete(storeName, key) {
    this.ensureCacheExists(storeName);
    return this.caches.get(storeName).data.delete(this.getCacheKey(key));
  }

  // Clear entire cache store
  clear(storeName) {
    this.ensureCacheExists(storeName);
    this.caches.get(storeName).data.clear();
  }

  // Get all cached items in a store
  getAll(storeName) {
    this.ensureCacheExists(storeName);
    const cache = this.caches.get(storeName);
    const result = new Map();

    for (const [key, item] of cache.data.entries()) {
      if (!this.isExpired(item)) {
        result.set(key, item.value);
      } else {
        this.delete(storeName, key);
      }
    }

    return result;
  }

  // Check if key exists in cache
  has(storeName, key) {
    this.ensureCacheExists(storeName);
    const cache = this.caches.get(storeName);
    const item = cache.data.get(this.getCacheKey(key));

    if (!item) {
      return false;
    }

    if (this.isExpired(item)) {
      this.delete(storeName, key);
      return false;
    }

    return true;
  }

  // Get cache size
  size(storeName) {
    this.ensureCacheExists(storeName);
    return this.caches.get(storeName).data.size;
  }

  // Get cache statistics
  getStats(storeName) {
    this.ensureCacheExists(storeName);
    const cache = this.caches.get(storeName);
    const stats = {
      size: cache.data.size,
      maxSize: cache.config.maxSize,
      ttl: cache.config.ttl,
      expired: 0,
      valid: 0
    };

    for (const item of cache.data.values()) {
      if (this.isExpired(item)) {
        stats.expired++;
      } else {
        stats.valid++;
      }
    }

    return stats;
  }

  // Helper methods
  private ensureCacheExists(storeName) {
    if (!this.caches.has(storeName)) {
      this.initializeCache(storeName);
    }
  }

  private getCacheKey(key) {
    if (typeof key === 'string') {
      return key;
    }
    return JSON.stringify(key);
  }

  private isExpired(item) {
    return Date.now() - item.timestamp > item.ttl;
  }

  private evictOldest(storeName) {
    const cache = this.caches.get(storeName);
    let oldestKey = null;
    let oldestTimestamp = Infinity;

    for (const [key, item] of cache.data.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      cache.data.delete(oldestKey);
    }
  }
}

// Create and export singleton instance
export const cacheManager = new CacheManager();

// Initialize common cache stores
cacheManager.initializeCache('utilityData', {
  ttl: 30 * 60 * 1000 // 30 minutes
});

cacheManager.initializeCache('leadScores', {
  ttl: 15 * 60 * 1000 // 15 minutes
});

cacheManager.initializeCache('solarData', {
  ttl: 60 * 60 * 1000 // 1 hour
});

// Export cache decorator for class methods
export function cached(storeName, keyGenerator) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const key = keyGenerator ? keyGenerator.apply(this, args) : args[0];
      const cachedResult = cacheManager.get(storeName, key);

      if (cachedResult !== null) {
        return cachedResult;
      }

      const result = await originalMethod.apply(this, args);
      cacheManager.set(storeName, key, result);
      return result;
    };

    return descriptor;
  };
} 