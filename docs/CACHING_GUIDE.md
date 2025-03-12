# Caching Implementation Guide

This guide explains the caching system implemented in the ReplyRocket.io application to optimize API calls and improve performance.

## Overview

The caching system consists of two main components:
1. **Frontend Caching**: Using React Query for client-side data caching
2. **Backend Caching**: Using Redis (or in-memory fallback) for server-side caching

This dual-layer approach ensures that redundant API calls are minimized both on the client and server sides.

## Frontend Caching with React Query

React Query provides a powerful caching and state management solution for fetching, caching, and updating asynchronous data in React applications.

### Key Components

1. **QueryProvider**: Global provider for React Query located in `src/lib/react-query.js`
2. **Custom Hooks**: Pre-defined hooks for common data fetching operations
3. **Cache Invalidation**: Automatic cache invalidation when mutations occur

### Available Custom Hooks

| Hook | Purpose | Caching Duration |
|------|---------|------------------|
| `useUserProfile()` | Fetches and caches the current user's profile | 10 minutes |
| `useUpdateUserProfile()` | Updates user profile with automatic cache invalidation | N/A (Mutation) |
| `useEmailHistory(limit, page, dateRange)` | Fetches email history with pagination | 2 minutes |
| `useSubscriptionData()` | Fetches subscription details | 5 minutes |

### Usage Examples

#### Fetching User Profile

```jsx
import { useUserProfile } from '../lib/react-query';

function ProfileComponent() {
  const { data: userProfile, isLoading, error } = useUserProfile();
  
  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  
  return (
    <div>
      <h2>Welcome, {userProfile.email}</h2>
      <p>Subscription: {userProfile.subscription_tier}</p>
    </div>
  );
}
```

#### Updating User Profile

```jsx
import { useUpdateUserProfile } from '../lib/react-query';

function ProfileEditForm() {
  const [formData, setFormData] = useState({});
  const updateProfile = useUpdateUserProfile();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateProfile.mutateAsync(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={updateProfile.isLoading}>
        {updateProfile.isLoading ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

## Backend Caching with Redis

The backend uses Redis for caching frequently accessed data to reduce database load and improve response times.

### Key Components

1. **Redis Client**: Connection management in `pages/api/utils/redis-client.js`
2. **Cache Utilities**: Helper functions for caching API responses
3. **In-Memory Fallback**: Automatic fallback when Redis is unavailable

### Available Utilities

| Utility | Purpose |
|---------|---------|
| `getRedisClient()` | Gets Redis client instance with fallback |
| `cacheOrFetch(key, fetchFn, expirySeconds)` | Fetches from cache or calls function |
| `invalidateCache(key)` | Manually invalidates a cache entry |

### Cache Keys

| Key Pattern | Purpose | Expiry |
|-------------|---------|--------|
| `user:profile:{userId}` | User profile data | 10 minutes |
| `user:usage:{userId}` | User usage limits | 2 minutes |
| `subscription:{userId}` | Subscription details | 10 minutes |

### Usage Examples

#### Caching API Responses

```javascript
import { cacheOrFetch } from './utils/redis-client';

export default async function handler(req, res) {
  const userId = req.user.id;
  
  try {
    // Define cache key
    const cacheKey = `data:${userId}:${req.query.type}`;
    
    // Use cacheOrFetch utility
    const data = await cacheOrFetch(
      cacheKey,
      async () => {
        // This function only runs on cache miss
        const result = await database.fetchExpensiveData(userId);
        return result;
      },
      300 // Cache for 5 minutes
    );
    
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

#### Invalidating Cache

```javascript
import { invalidateCache } from './utils/redis-client';

export default async function handler(req, res) {
  const userId = req.user.id;
  
  try {
    // Update the database
    await database.updateData(userId, req.body);
    
    // Invalidate relevant caches
    await invalidateCache(`user:profile:${userId}`);
    await invalidateCache(`user:usage:${userId}`);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

## Configuration

### Environment Variables

```env
# Redis Configuration (for production caching)
REDIS_URL=redis://username:password@your-redis-host:6379
# Or alternatively:
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Development options
USE_REDIS_IN_DEV=false  # Set to true to use Redis in development
```

### Redis Providers

For production, consider using one of these Redis providers:
- **Upstash**: Serverless Redis with free tier
- **Redis Cloud**: Managed Redis service
- **AWS ElastiCache**: For AWS deployments
- **Digital Ocean Managed Databases**: Redis option available
- **Self-hosted Redis**: For complete control

## Best Practices

1. **Appropriate Cache Durations**: Balance freshness with performance
   - Frequently changing data: 1-2 minutes
   - Relatively stable data: 5-15 minutes
   - Static content: Hours or days

2. **Cache Invalidation**: Invalidate caches when data changes
   - Clear specific cache entries after mutations
   - Use cache keys that reflect data dependencies

3. **Fallback Mechanisms**: Always have a fallback when cache fails
   - React Query's `staleTime` vs `cacheTime`
   - Backend in-memory cache when Redis is unavailable

4. **Optimistic Updates**: Update UI before server confirms
   - Use React Query's `optimisticUpdate` feature
   - Roll back to previous state if server reports error

5. **Selective Caching**: Not everything needs caching
   - Cache expensive operations
   - Don't cache rapidly changing or sensitive data

## Troubleshooting

### Frontend Caching Issues

- **Stale Data**: Use `queryClient.invalidateQueries()` to refresh
- **Cache Not Working**: Check React Query DevTools for cache status
- **Too Many Refetches**: Adjust `staleTime` and `refetchOnWindowFocus`

### Backend Caching Issues

- **Redis Connection Errors**: Check environment variables and network
- **Memory Usage**: Monitor Redis memory usage and set appropriate maxmemory policy
- **Cache Misses**: Log cache hits/misses to identify ineffective caching

## Monitoring

Consider adding these monitoring indicators:
- Cache hit ratio
- Redis memory usage
- Average response time for cached vs uncached requests 