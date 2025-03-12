import redis from '../../../lib/redis';
import { isRedisMock } from '../../../lib/redis';

/**
 * Redis-based rate limiter for production use
 * Uses Redis to track and limit API requests across multiple server instances
 * 
 * Key advantages over in-memory limiter:
 * 1. Works across multiple server instances (horizontal scaling)
 * 2. Persists across server restarts
 * 3. More efficient memory usage for large numbers of clients
 * 4. Built-in expiration of keys
 */

class RedisRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes in milliseconds
    this.maxRequests = options.maxRequests || 100; // Maximum requests per window
    this.prefix = options.prefix || 'ratelimit:';
    this.redis = redis;

    // Fallback to in-memory in development if Redis is not available
    this.fallbackToMemory = options.fallbackToMemory || isRedisMock;
    
    // In-memory store as fallback
    if (this.fallbackToMemory) {
      console.warn('Redis rate limiter is using in-memory fallback mode');
      this.memoryStore = new Map();
    }
  }

  /**
   * Check if a key is rate limited and increment its counter
   * @param {string} key - The key to check (usually an IP address)
   * @returns {Promise<Object>} Rate limiting result
   */
  async limit(key) {
    const prefixedKey = `${this.prefix}${key}`;
    
    try {
      if (this.fallbackToMemory) {
        return this._memoryLimit(key);
      }
      
      // Use Redis Lua script for atomic increment and check
      // This is more efficient and prevents race conditions
      const luaScript = `
        local current = redis.call('incr', KEYS[1])
        local ttl
        if tonumber(current) == 1 then
          redis.call('pexpire', KEYS[1], ARGV[1])
          ttl = ARGV[1]
        else
          ttl = redis.call('pttl', KEYS[1])
        end
        return {current, ttl}
      `;
      
      const result = await this.redis.eval(
        luaScript,
        1,
        prefixedKey,
        this.windowMs
      );
      
      const requestCount = result[0];
      const ttl = result[1];
      
      const isRateLimited = requestCount > this.maxRequests;
      const remainingRequests = Math.max(0, this.maxRequests - requestCount);
      const resetTime = Date.now() + ttl;
      
      return {
        isRateLimited,
        remainingRequests,
        resetTime,
        totalRequests: requestCount
      };
    } catch (error) {
      console.error('Redis rate limiting error:', error);
      
      // Fallback to memory if Redis fails
      if (!this.fallbackToMemory) {
        console.warn('Falling back to in-memory rate limiting due to Redis error');
        this.fallbackToMemory = true;
        this.memoryStore = new Map();
        return this._memoryLimit(key);
      }
      
      // If we're already in fallback mode and still failing, allow the request
      return {
        isRateLimited: false,
        remainingRequests: this.maxRequests,
        resetTime: Date.now() + this.windowMs,
        totalRequests: 1
      };
    }
  }
  
  /**
   * In-memory fallback for rate limiting
   * @param {string} key - The key to check (usually an IP address)
   * @returns {Object} Rate limiting result
   */
  _memoryLimit(key) {
    const now = Date.now();
    const data = this.memoryStore.get(key);
    
    if (!data) {
      // First request
      this.memoryStore.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      
      return {
        isRateLimited: false,
        remainingRequests: this.maxRequests - 1,
        resetTime: now + this.windowMs,
        totalRequests: 1
      };
    }
    
    if (now > data.resetTime) {
      // Window expired, reset
      this.memoryStore.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      
      return {
        isRateLimited: false,
        remainingRequests: this.maxRequests - 1,
        resetTime: now + this.windowMs,
        totalRequests: 1
      };
    }
    
    // Increment counter
    const count = data.count + 1;
    this.memoryStore.set(key, {
      count,
      resetTime: data.resetTime
    });
    
    const isRateLimited = count > this.maxRequests;
    const remainingRequests = Math.max(0, this.maxRequests - count);
    
    return {
      isRateLimited,
      remainingRequests,
      resetTime: data.resetTime,
      totalRequests: count
    };
  }
}

// Create and export the rate limiter instance
export const rateLimiter = new RedisRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
  prefix: 'ratelimit:api:', // Redis key prefix
  fallbackToMemory: true, // Use in-memory fallback if Redis is unavailable
});

// Export the middleware function to use in API routes
export function withRedisRateLimit(handler, options = {}) {
  return async (req, res) => {
    // Get the client IP address
    const ip = req.headers['x-forwarded-for'] || 
               req.socket.remoteAddress || 
               'unknown';
    
    // Use custom key if provided in options
    const key = options.keyGenerator ? options.keyGenerator(req, res) : ip;
    
    // Apply rate limiting
    const result = await rateLimiter.limit(key);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', rateLimiter.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remainingRequests);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));
    
    // Check if rate limited
    if (result.isRateLimited && !options.skipFailedRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      });
    }
    
    // Continue to the API handler
    return handler(req, res);
  };
}

export default withRedisRateLimit; 