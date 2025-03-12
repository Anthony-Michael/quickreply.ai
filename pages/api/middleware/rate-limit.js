/**
 * A simple in-memory rate limiter for Next.js API routes
 * Limits requests to 100 per 15 minutes per IP address
 * 
 * Note: For production use with multiple server instances, 
 * consider using Redis or another distributed storage solution
 */

// In-memory store for rate limiting
const rateLimit = {
  // Store IP addresses and their request counts
  ips: new Map(),
  
  // Rate limit configuration
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  maxRequests: 100, // Maximum requests per window
  
  // Check if the IP has exceeded the rate limit
  isRateLimited: function(ip) {
    const now = Date.now();
    const ipData = this.ips.get(ip);
    
    if (!ipData) {
      // First request from this IP
      this.ips.set(ip, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return false;
    }
    
    if (now > ipData.resetTime) {
      // Rate limit window has passed, reset the counter
      this.ips.set(ip, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return false;
    }
    
    // Increment the request count
    ipData.count += 1;
    this.ips.set(ip, ipData);
    
    // Check if rate limit exceeded
    return ipData.count > this.maxRequests;
  },
  
  // Get remaining requests for an IP
  getRemainingRequests: function(ip) {
    const ipData = this.ips.get(ip);
    if (!ipData) return this.maxRequests;
    
    if (Date.now() > ipData.resetTime) return this.maxRequests;
    
    return Math.max(0, this.maxRequests - ipData.count);
  },
  
  // Get reset time for an IP
  getResetTime: function(ip) {
    const ipData = this.ips.get(ip);
    if (!ipData) return Date.now() + this.windowMs;
    
    return ipData.resetTime;
  }
};

// Clean up the rate limiter data periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  
  for (const [ip, data] of rateLimit.ips.entries()) {
    if (now > data.resetTime) {
      rateLimit.ips.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

/**
 * Apply rate limiting to a Next.js API handler
 * @param {Function} handler - The Next.js API route handler
 * @returns {Function} - Rate-limited API handler
 */
export function withRateLimit(handler) {
  return async (req, res) => {
    // Get the client IP address
    const ip = req.headers['x-forwarded-for'] || 
               req.connection.remoteAddress || 
               'unknown';
    
    // Check if the IP is rate limited
    if (rateLimit.isRateLimited(ip)) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((rateLimit.getResetTime(ip) - Date.now()) / 1000)
      });
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', rateLimit.maxRequests);
    res.setHeader('X-RateLimit-Remaining', rateLimit.getRemainingRequests(ip));
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimit.getResetTime(ip) / 1000));
    
    // Continue to the API handler
    return handler(req, res);
  };
}

export default withRateLimit; 