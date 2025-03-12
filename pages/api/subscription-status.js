import { supabaseAdmin, authenticateRequest } from './utils/supabase-admin';
import { getRedisClient } from './utils/redis-client';

// Cache expiration time (10 minutes)
const CACHE_EXPIRY = 60 * 10;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateRequest(req);
    
    if (authError) {
      return res.status(401).json({ error: authError });
    }

    // Get Redis client
    const redis = getRedisClient();
    
    // Try to get cached data from Redis first
    const cacheKey = `subscription:${user.id}`;
    let subscriptionData;
    
    if (redis) {
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          subscriptionData = JSON.parse(cachedData);
          return res.status(200).json(subscriptionData);
        }
      } catch (redisError) {
        // Just log the error and continue with database fetch
        console.warn('Redis cache fetch failed:', redisError);
      }
    }

    // If not in cache, fetch from database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier, monthly_responses_limit, monthly_responses_used, subscription_end_date, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: 'Failed to retrieve subscription data' });
    }

    // Format the response data
    subscriptionData = {
      plan: profile.subscription_tier || 'free',
      responseLimit: profile.monthly_responses_limit || 25,
      responsesUsed: profile.monthly_responses_used || 0,
      subscriptionEndDate: profile.subscription_end_date,
      isActive: profile.subscription_end_date ? new Date(profile.subscription_end_date) > new Date() : false
    };

    // Cache in Redis if available
    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(subscriptionData), 'EX', CACHE_EXPIRY);
      } catch (redisError) {
        console.warn('Redis cache set failed:', redisError);
      }
    }

    return res.status(200).json(subscriptionData);
  } catch (error) {
    console.error('Error retrieving subscription status:', error);
    return res.status(500).json({ error: 'Failed to retrieve subscription status' });
  }
} 