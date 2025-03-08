import { createClient } from "@supabase/supabase-js";

// Get environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

let supabase;

// Check if environment variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase environment variables are missing. Using mock client for development.");
  
  // For development only - REPLACE WITH REAL CREDENTIALS FOR PRODUCTION
  const mockSupabaseClient = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: (callback) => {
        // Return a mock subscription
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signInWithPassword: () => Promise.resolve({ error: null, data: { user: { id: 'mock-user-id', email: 'user@example.com' } } }),
      signUp: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: null })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        }),
        match: () => Promise.resolve({ data: [], error: null })
      }),
      insert: () => Promise.resolve({ error: null }),
      update: () => ({
        eq: () => Promise.resolve({ error: null })
      })
    })
  };
  
  supabase = mockSupabaseClient;
} else {
  // Use actual Supabase client with real credentials
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
