import Redis from 'ioredis';

// Environment variables for Redis configuration
const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

// Redis client options
const options = {
  // If REDIS_URL is provided, use it, otherwise use host/port
  ...(REDIS_URL ? { } : { host: REDIS_HOST, port: REDIS_PORT }),
  password: REDIS_PASSWORD,
  // Retry strategy for when connection is lost
  retryStrategy: (times) => {
    // Exponential backoff with max 3000ms
    const delay = Math.min(times * 50, 3000);
    return delay;
  },
  // Reconnect on error unless it's a fatal error
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Force reconnect on READONLY error (common in Redis cluster/replication)
      return true;
    }
    return false;
  },
};

// Create Redis client
let redisClient;

if (global.redis) {
  // Use existing Redis connection
  redisClient = global.redis;
} else {
  // Create new Redis connection
  if (REDIS_URL) {
    redisClient = new Redis(REDIS_URL, options);
  } else {
    redisClient = new Redis(options);
  }

  // Save the client for reuse
  global.redis = redisClient;
}

// Listen for connection events
redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Export Redis client
export default redisClient;

// Check if Redis is in development/mock mode
export const isRedisMock = !REDIS_URL && !REDIS_PASSWORD && REDIS_HOST === 'localhost'; 