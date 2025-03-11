import { supabaseAdmin, authenticateRequest } from '../utils/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate the request
    const { user, error } = await authenticateRequest(req);
    
    if (error) {
      return res.status(401).json({ error });
    }

    // Return user data
    return res.status(200).json({ data: { user } });
  } catch (error) {
    console.error('Session error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 