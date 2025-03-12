# Production Rate Limiting with Redis

This document explains the rate limiting implementation for the QuickReply.ai application, designed for production environments using Redis.

## Overview

Our application implements a robust, distributed rate limiting system based on Redis to protect our API endpoints from abuse and ensure fair resource allocation. This system works across multiple server instances and persists rate limit data even during server restarts.

## Key Features

- **Distributed rate limiting**: Works across multiple server instances
- **Persistence**: Rate limit data persists across server restarts
- **Fault tolerance**: Falls back to in-memory storage if Redis is unavailable
- **Customizable**: Configurable windows, limits, and key generation strategies
- **User-based**: Can rate limit by user ID instead of just IP address
- **Endpoint-specific**: Different limits for different API endpoints
- **Standards-compliant**: Implements standard rate limit headers

## Implementation Details

### Components

1. **Redis Client** (`lib/redis.js`)
   - Handles connection to Redis
   - Provides error handling and reconnection logic
   - Offers fallback mechanism for development

2. **Redis Rate Limiter** (`pages/api/middleware/redis-rate-limit.js`)
   - Core rate limiting logic using Redis and Lua scripts
   - Atomic increments and expiry handling
   - In-memory fallback for development/failover

3. **Middleware Integration** (`middleware.js`)
   - Edge middleware for initial request processing
   - Headers-based signaling for API routes

4. **API Route Implementation**
   - Custom integration per API endpoint
   - User-specific rate limiting where appropriate
   - Higher limits for trusted endpoints (webhooks)

### How It Works

1. For each request, a unique key is generated (typically based on IP address or user ID)
2. Redis atomically increments a counter for this key
3. If the key is new, an expiration time is set based on the configured window
4. The request is allowed or rejected based on the counter value
5. Rate limit headers are added to the response

### Failover Strategy

If Redis becomes unavailable, the system automatically falls back to in-memory rate limiting to ensure the API remains protected. This provides a good safety net, but doesn't offer the distributed capabilities of the Redis implementation.

## Configuration

### Environment Variables

```
# Redis Connection
REDIS_URL=redis://username:password@your-redis-host:6379
# Or alternatively:
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### Rate Limit Settings

Default settings (can be customized per endpoint):
- **Window**: 15 minutes
- **Max Requests**: 100 requests per window
- **Key Prefix**: `ratelimit:api:`

Webhook-specific settings:
- **Window**: 5 minutes
- **Max Requests**: 1000 requests per window
- **Key Prefix**: `ratelimit:webhook:`

## Deployment Considerations

### Redis Hosting Options

1. **Managed Redis Services**:
   - Upstash
   - Redis Cloud
   - AWS ElastiCache
   - Azure Cache for Redis
   - DigitalOcean Managed Redis

2. **Self-hosted Redis**:
   - Docker container
   - Virtual machine
   - Kubernetes deployment

### Production Recommendations

1. **Use a managed Redis service** for reliability and easy scaling
2. **Enable Redis persistence** to maintain rate limit data during Redis restarts
3. **Monitor Redis performance** to ensure it's not becoming a bottleneck
4. **Set up alerts** for Redis connection failures or high reject rates
5. **Tune rate limits** based on usage patterns and server capacity

## Troubleshooting

### Common Issues

1. **Redis Connection Failures**
   - Check network connectivity
   - Verify credentials and configuration
   - Ensure Redis server is running

2. **High Rejection Rates**
   - Review logs for potential abuse patterns
   - Consider increasing limits for legitimate high-volume users
   - Check if rate limits are too aggressive for typical usage

3. **Memory Usage**
   - Monitor Redis memory consumption
   - Adjust expiration times if needed
   - Consider Redis eviction policies

## Monitoring and Logging

The implementation logs:
- Redis connection status
- Fallback to in-memory storage
- Rate limiting decisions for critical endpoints

For production, consider adding:
- Prometheus metrics for rate limit hits/misses
- Dashboard for real-time monitoring
- Alert on high rejection rates or Redis issues 