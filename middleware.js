import { NextResponse } from 'next/server';

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
};

// We'll use Redis for rate limiting in production, but for the middleware
// we need to use a different approach since edge functions can't access Redis directly
// Instead, we'll have the middleware direct to an API endpoint that handles Redis rate limiting

export function middleware(request) {
  const response = NextResponse.next();
  
  // Only apply rate limiting to API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return response;
  }
  
  // Special case for webhooks - exempt from rate limiting
  if (request.nextUrl.pathname.includes('/api/stripe-webhook') ||
      request.nextUrl.pathname.includes('/api/webhooks')) {
    return response;
  }
  
  // For API routes, set a flag in the headers to be processed by API-level rate limiting
  // This works with our withRedisRateLimit middleware in API routes
  response.headers.set('X-Rate-Limit-Enabled', 'true');
  
  // Get the client IP for logging purposes (the actual rate limiting happens in the API route)
  const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';
  response.headers.set('X-Forwarded-For', ip);
  
  return response;
}

// Configure which paths this middleware will run on
export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
  ],
}; 