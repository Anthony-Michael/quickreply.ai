import { createClient } from '@supabase/supabase-js';

// Determine if we're in development mode
const isDevelopmentMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

// Initialize the Supabase client with your Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a development mode client that avoids real API calls
export const createDevClient = () => {
  console.log('Using development mode Supabase client');
  
  // Return a mock Supabase client
  return {
    auth: {
      getUser: () => Promise.resolve({
        data: { 
          user: { 
            id: 'dev-user-id', 
            email: 'dev@example.com',
            user_metadata: {
              full_name: 'Development User'
            }
          }
        }
      }),
      getSession: () => Promise.resolve({
        data: {
          session: {
            user: {
              id: 'dev-user-id',
              email: 'dev@example.com',
              user_metadata: {
                full_name: 'Development User'
              }
            },
            access_token: 'dev-mode-token'
          }
        }
      }),
      onAuthStateChange: (callback) => {
        callback('SIGNED_IN', {
          user: {
            id: 'dev-user-id',
            email: 'dev@example.com'
          }
        });
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signOut: () => Promise.resolve({ error: null }),
      signInWithPassword: () => Promise.resolve({
        data: {
          user: {
            id: 'dev-user-id',
            email: 'dev@example.com'
          },
          session: {
            access_token: 'fake-jwt-token'
          }
        },
        error: null
      }),
      signUp: () => Promise.resolve({
        data: {
          user: {
            id: 'dev-user-id',
            email: 'dev@example.com'
          }
        },
        error: null
      })
    },
    from: (table) => {
      // Mock database tables
      const tables = {
        profiles: [
          {
            id: 'dev-user-id',
            email: 'dev@example.com',
            full_name: 'Development User',
            subscription_tier: 'free',
            monthly_responses_limit: 25,
            monthly_responses_used: 0,
            business_name: 'Dev Company',
            business_description: 'A company used for development testing'
          }
        ],
        email_history: Array(5)
          .fill()
          .map((_, i) => ({
            id: `mock-${i}`,
            user_id: 'dev-user-id',
            created_at: new Date(Date.now() - i * 86400000).toISOString(),
            customer_email: `Mock customer email ${i}`,
            generated_response: `Mock response ${i}`,
            tone_requested: ['professional', 'friendly', 'formal', 'empathetic', 'concise'][i % 5]
          }))
      };
      
      // Create a query builder for the selected table
      return {
        select: (columns) => ({
          eq: (field, value) => ({
            order: (orderField, { ascending }) => ({
              limit: (limit) => {
                // Return data from the mock tables
                const mockData = tables[table] || [];
                return Promise.resolve({
                  data: mockData.slice(0, limit),
                  error: null
                });
              },
              single: () => {
                // Find the matching record
                const record = (tables[table] || []).find(r => r[field] === value);
                return Promise.resolve({
                  data: record || null,
                  error: null
                });
              }
            }),
            single: () => {
              // Find the matching record
              const record = (tables[table] || []).find(r => r[field] === value);
              return Promise.resolve({
                data: record || null,
                error: null
              });
            }
          })
        }),
        insert: (data) => Promise.resolve({ data, error: null }),
        update: (data) => Promise.resolve({ data, error: null }),
        upsert: (data) => Promise.resolve({ data, error: null })
      };
    }
  };
};

// Initialize Supabase client
export const supabase = isDevelopmentMode 
  ? createDevClient() 
  : createClient(supabaseUrl, supabaseAnonKey);
