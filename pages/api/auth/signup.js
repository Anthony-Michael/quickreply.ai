import { supabaseAdmin } from '../utils/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sign up with email and password
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password
    });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // If signup is successful but requires email confirmation
    if (data?.user?.identities?.length === 0) {
      return res.status(200).json({ 
        message: 'User already registered. Please check your email for confirmation.',
        data
      });
    }

    // Create a profile for the new user
    if (data?.user) {
      await supabaseAdmin
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          monthly_responses_limit: 25, // Default for free tier
          monthly_responses_used: 0,
          subscription_tier: 'free'
        });
    }

    // Return session data
    return res.status(200).json({ data });
  } catch (error) {
    console.error('Sign up error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 