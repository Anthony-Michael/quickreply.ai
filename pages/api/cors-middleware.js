/**
 * Middleware to handle CORS headers for API routes
 * @param {Function} handler - The API route handler function
 * @returns {Function} - Enhanced handler with CORS support
 */
export const corsMiddleware = (handler) => async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', 'https://www.rocketreply.io');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-client-info, apikey');
    
    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Pass control to the actual API handler
    return handler(req, res);
  };