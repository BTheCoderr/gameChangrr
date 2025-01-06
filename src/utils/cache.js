// Simple in-memory cache implementation
const cache = new Map();

// Cache configuration
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Maximum number of items to cache

// Helper to create cache key from bounds and filters
const createCacheKey = (layerId, bounds, filters) => {
  const boundsKey = bounds.map(coord => coord.toFixed(4)).join(',');
  return `${layerId}:${boundsKey}:${JSON.stringify(filters)}`;
};

// Helper to check if cache entry is expired
const isExpired = (timestamp) => {
  return Date.now() - timestamp > DEFAULT_CACHE_DURATION;
};

// Helper to clean up old cache entries
const cleanCache = () => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (isExpired(value.timestamp)) {
      cache.delete(key);
    }
  }

  // If still over size limit, remove oldest entries
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => cache.delete(key));
  }
};

export const cacheData = (layerId, bounds, filters, data) => {
  cleanCache();
  const key = createCacheKey(layerId, bounds, filters);
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

export const getCachedData = (layerId, bounds, filters) => {
  const key = createCacheKey(layerId, bounds, filters);
  const cached = cache.get(key);
  
  if (!cached || isExpired(cached.timestamp)) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

export const clearCache = () => {
  cache.clear();
};

// Helper to get cache stats
export const getCacheStats = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}; 