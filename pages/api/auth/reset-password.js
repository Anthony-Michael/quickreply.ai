import { supabaseAdmin } from '../utils/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Send password reset email
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${req.headers.origin}/reset-password`
    });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Return success message
    return res.status(200).json({ 
      message: 'Password reset email sent. Please check your inbox.' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 