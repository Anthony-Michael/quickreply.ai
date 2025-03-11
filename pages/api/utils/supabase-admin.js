import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Ensure environment variables are set
if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    'Error: Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  );
}

// Create Supabase client with admin privileges
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export { supabaseAdmin };

// Utility function to authenticate a request with JWT token
export async function authenticateRequest(req) {
  // Get the JWT token from the Authorization header
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return { user: null, error: 'No token provided' };
  }

  // Verify the token and get user data
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error || !data.user) {
    return { user: null, error: error?.message || 'Invalid token' };
  }

  return { user: data.user, error: null };
} 