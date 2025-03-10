import { supabaseAdmin, authenticateRequest } from '../utils/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateRequest(req);
    
    if (authError) {
      return res.status(401).json({ error: authError });
    }

    // Sign out the user
    const { error } = await supabaseAdmin.auth.admin.signOut(req.headers.authorization?.split(' ')[1]);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Return success message
    return res.status(200).json({ message: 'Successfully signed out' });
  } catch (error) {
    console.error('Sign out error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 