import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from 'react-query';
import { supabase } from './supabase';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      onError: (err) => console.error('Query error:', err),
    },
  },
});

// Reusable query hooks for common data needs

/**
 * Hook to fetch and cache the current user's profile data
 */
export function useUserProfile() {
  return useQuery(
    'userProfile',
    async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    {
      // Don't refetch on window focus for user data
      refetchOnWindowFocus: false,
      // Keep cached for 10 minutes
      staleTime: 1000 * 60 * 10,
      // Create default profile if none exists
      onError: async (error) => {
        if (error.message?.includes('No rows found')) {
          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              const defaultProfile = {
                id: user.id,
                email: user.email,
                subscription_tier: 'free',
                monthly_responses_limit: 25,
                monthly_responses_used: 0,
                business_name: 'Your Business',
                business_description: 'Your business description',
              };

              await supabase.from('profiles').upsert([defaultProfile]);

              // Invalidate the query to refetch with the new profile
              queryClient.invalidateQueries('userProfile');
            }
          } catch (createError) {
            console.error('Failed to create default profile:', createError);
          }
        }
      },
    }
  );
}

/**
 * Hook to update user profile with automatic cache invalidation
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation(
    async (profileData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date(),
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      return data;
    },
    {
      // When mutation succeeds, invalidate the user profile query
      onSuccess: () => {
        queryClient.invalidateQueries('userProfile');
      },
    }
  );
}

/**
 * Hook to fetch email history with pagination support
 */
export function useEmailHistory(limit = 10, page = 0, dateRange = 30) {
  return useQuery(
    ['emailHistory', limit, page, dateRange],
    async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - dateRange);

      const { data, error, count } = await supabase
        .from('email_history')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) {
        throw error;
      }

      return { data, count };
    },
    {
      keepPreviousData: true, // Keeps old data while fetching new data
      staleTime: 1000 * 60 * 2, // 2 minutes
    }
  );
}

/**
 * Hook to fetch cached subscription data
 */
export function useSubscriptionData() {
  const { data: userProfile } = useUserProfile();

  return useQuery(
    'subscriptionData',
    async () => {
      if (!userProfile?.stripe_subscription_id) {
        return {
          plan: userProfile?.subscription_tier || 'free',
          responseLimit: userProfile?.monthly_responses_limit || 25,
          responsesUsed: userProfile?.monthly_responses_used || 0,
          subscriptionEndDate: userProfile?.subscription_end_date || null,
        };
      }

      // Only fetch from API if there's an active subscription
      const response = await fetch('/api/subscription-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription data');
      }

      return await response.json();
    },
    {
      // Only run this query if we have the user profile
      enabled: !!userProfile,
      // Cache subscription data for 5 minutes
      staleTime: 1000 * 60 * 5,
    }
  );
}

/**
 * QueryClientProvider to wrap your application
 */
export function QueryProvider({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
