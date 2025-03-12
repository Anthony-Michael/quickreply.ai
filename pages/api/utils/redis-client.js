import Redis from 'ioredis';

// Initialize Redis client with graceful fallback for development/errors
let redisClient = null;

// Simple in-memory cache for development or when Redis is not available
const memoryCache = new Map();

/**
 * Gets or creates a Redis client instance
 * Uses a global singleton pattern to avoid creating multiple connections
 */
export function getRedisClient() {
  // Return existing client if already initialized
  if (redisClient) {
    return redisClient;
  }
  
  // Skip Redis in development mode unless specifically enabled
  if (process.env.NODE_ENV === 'development' && !process.env.USE_REDIS_IN_DEV) {
    console.log('Using in-memory cache for development');
    return createMemoryCacheClient();
  }
  
  try {
    // Try to create Redis client from URL or individual settings
    if (process.env.REDIS_URL) {
      redisClient = new Redis(process.env.REDIS_URL);
    } else if (process.env.REDIS_HOST) {
      redisClient = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
        // Auto reconnect with backoff
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });
    } else {
      console.warn('Redis configuration not found, using in-memory cache');
      return createMemoryCacheClient();
    }
    
    // Set up event listeners
    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });
    
    redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });
    
    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    return createMemoryCacheClient();
  }
}

/**
 * Creates a memory-based client that mimics Redis for development
 */
function createMemoryCacheClient() {
  // Return a simple object with the same interface as Redis for basic operations
  return {
    async get(key) {
      const item = memoryCache.get(key);
      if (!item) return null;
      
      // Check if expired
      if (item.expiry && item.expiry < Date.now()) {
        memoryCache.delete(key);
        return null;
      }
      
      return item.value;
    },
    
    async set(key, value, expiryType, expiry) {
      let expiryMs = null;
      
      // Handle expiry settings similar to Redis
      if (expiryType === 'EX') {
        expiryMs = Date.now() + (expiry * 1000); // Convert seconds to ms
      } else if (expiryType === 'PX') {
        expiryMs = Date.now() + expiry; // Already in ms
      }
      
      memoryCache.set(key, { 
        value, 
        expiry: expiryMs 
      });
      
      return 'OK';
    },
    
    async del(key) {
      return memoryCache.delete(key) ? 1 : 0;
    },
    
    async flushall() {
      memoryCache.clear();
      return 'OK';
    },
    
    // Auto-expire items (call periodically)
    cleanup() {
      const now = Date.now();
      for (const [key, item] of memoryCache.entries()) {
        if (item.expiry && item.expiry < now) {
          memoryCache.delete(key);
        }
      }
    }
  };
}

/**
 * Utility function to cache API responses
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to get data if not cached
 * @param {number} expirySeconds - Seconds until cache expiry (default: 10 minutes)
 */
export async function cacheOrFetch(key, fetchFn, expirySeconds = 600) {
  const redis = getRedisClient();
  
  try {
    // Try to get from cache first
    const cachedData = await redis.get(key);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    // If not in cache, fetch fresh data
    const freshData = await fetchFn();
    
    // Cache the result
    await redis.set(key, JSON.stringify(freshData), 'EX', expirySeconds);
    
    return freshData;
  } catch (error) {
    console.error(`Cache operation failed for key ${key}:`, error);
    // If cache fails, just fetch the data directly
    return fetchFn();
  }
}

/**
 * Invalidate a cache entry
 * @param {string} key - Cache key to invalidate
 */
export async function invalidateCache(key) {
  const redis = getRedisClient();
  
  try {
    await redis.del(key);
  } catch (error) {
    console.error(`Failed to invalidate cache for key ${key}:`, error);
  }
}

// Schedule periodic cleanup for memory cache fallback
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    if (redisClient?.cleanup) {
      redisClient.cleanup();
    }
  }, 60000); // Every minute
} 