-- Supabase Row Level Security Policy Check-and-Create Script
-- Generated: 2025-03-12T03:02:54.133Z
--
-- INSTRUCTIONS:
-- 1. Log in to your Supabase dashboard: https://xielolacmdldnviravvf.supabase.co
-- 2. Go to the SQL Editor
-- 3. Copy and paste this entire script
-- 4. Execute the script
-- 5. Verify the policies were created successfully
--
-- Note: This script will check if policies exist before creating them

-- Helper function to check if a policy exists
CREATE OR REPLACE FUNCTION policy_exists(policy_name text, table_name text)
RETURNS boolean AS $$
DECLARE
  exists_val boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies 
    WHERE policyname = policy_name 
    AND tablename = table_name
  ) INTO exists_val;
  
  RETURN exists_val;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on all tables (this is idempotent)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- For profiles table
DO $$ 
BEGIN
  -- Profile SELECT policy
  IF NOT policy_exists('Users can view their own profile', 'profiles') THEN
    CREATE POLICY "Users can view their own profile"
      ON profiles FOR SELECT
      USING (auth.uid() = id);
    RAISE NOTICE 'Created policy: Users can view their own profile';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can view their own profile';
  END IF;
  
  -- Profile UPDATE policy
  IF NOT policy_exists('Users can update their own profile', 'profiles') THEN
    CREATE POLICY "Users can update their own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id);
    RAISE NOTICE 'Created policy: Users can update their own profile';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can update their own profile';
  END IF;
  
  -- Profile INSERT policy
  IF NOT policy_exists('Users cannot insert profiles directly', 'profiles') THEN
    CREATE POLICY "Users cannot insert profiles directly"
      ON profiles FOR INSERT
      WITH CHECK (false);
    RAISE NOTICE 'Created policy: Users cannot insert profiles directly';
  ELSE
    RAISE NOTICE 'Policy already exists: Users cannot insert profiles directly';
  END IF;
  
  -- Profile DELETE policy
  IF NOT policy_exists('Users cannot delete profiles', 'profiles') THEN
    CREATE POLICY "Users cannot delete profiles"
      ON profiles FOR DELETE
      USING (false);
    RAISE NOTICE 'Created policy: Users cannot delete profiles';
  ELSE
    RAISE NOTICE 'Policy already exists: Users cannot delete profiles';
  END IF;
END $$;

-- For email_history table
DO $$ 
BEGIN
  -- Email history SELECT policy
  IF NOT policy_exists('Users can view their own email history', 'email_history') THEN
    CREATE POLICY "Users can view their own email history"
      ON email_history FOR SELECT
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can view their own email history';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can view their own email history';
  END IF;
  
  -- Email history INSERT policy
  IF NOT policy_exists('Users can create their own email history', 'email_history') THEN
    CREATE POLICY "Users can create their own email history"
      ON email_history FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can create their own email history';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can create their own email history';
  END IF;
  
  -- Email history UPDATE policy
  IF NOT policy_exists('Users can update their own email history', 'email_history') THEN
    CREATE POLICY "Users can update their own email history"
      ON email_history FOR UPDATE
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can update their own email history';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can update their own email history';
  END IF;
  
  -- Email history DELETE policy
  IF NOT policy_exists('Users can delete their own email history', 'email_history') THEN
    CREATE POLICY "Users can delete their own email history"
      ON email_history FOR DELETE
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can delete their own email history';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can delete their own email history';
  END IF;
END $$;

-- For email_templates table
DO $$ 
BEGIN
  -- Templates SELECT policy
  IF NOT policy_exists('Users can view their own email templates', 'email_templates') THEN
    CREATE POLICY "Users can view their own email templates"
      ON email_templates FOR SELECT
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can view their own email templates';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can view their own email templates';
  END IF;
  
  -- Templates INSERT policy
  IF NOT policy_exists('Users can create their own email templates', 'email_templates') THEN
    CREATE POLICY "Users can create their own email templates"
      ON email_templates FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can create their own email templates';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can create their own email templates';
  END IF;
  
  -- Templates UPDATE policy
  IF NOT policy_exists('Users can update their own email templates', 'email_templates') THEN
    CREATE POLICY "Users can update their own email templates"
      ON email_templates FOR UPDATE
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can update their own email templates';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can update their own email templates';
  END IF;
  
  -- Templates DELETE policy
  IF NOT policy_exists('Users can delete their own email templates', 'email_templates') THEN
    CREATE POLICY "Users can delete their own email templates"
      ON email_templates FOR DELETE
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can delete their own email templates';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can delete their own email templates';
  END IF;
END $$;

-- For subscription_events table
DO $$ 
BEGIN
  -- Subscription events SELECT policy
  IF NOT policy_exists('Users can view their own subscription events', 'subscription_events') THEN
    CREATE POLICY "Users can view their own subscription events"
      ON subscription_events FOR SELECT
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can view their own subscription events';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can view their own subscription events';
  END IF;
  
  -- Subscription events INSERT policy
  IF NOT policy_exists('Users cannot insert subscription events', 'subscription_events') THEN
    CREATE POLICY "Users cannot insert subscription events"
      ON subscription_events FOR INSERT
      WITH CHECK (false);
    RAISE NOTICE 'Created policy: Users cannot insert subscription events';
  ELSE
    RAISE NOTICE 'Policy already exists: Users cannot insert subscription events';
  END IF;
  
  -- Subscription events UPDATE policy
  IF NOT policy_exists('Users cannot update subscription events', 'subscription_events') THEN
    CREATE POLICY "Users cannot update subscription events"
      ON subscription_events FOR UPDATE
      USING (false);
    RAISE NOTICE 'Created policy: Users cannot update subscription events';
  ELSE
    RAISE NOTICE 'Policy already exists: Users cannot update subscription events';
  END IF;
  
  -- Subscription events DELETE policy
  IF NOT policy_exists('Users cannot delete subscription events', 'subscription_events') THEN
    CREATE POLICY "Users cannot delete subscription events"
      ON subscription_events FOR DELETE
      USING (false);
    RAISE NOTICE 'Created policy: Users cannot delete subscription events';
  ELSE
    RAISE NOTICE 'Policy already exists: Users cannot delete subscription events';
  END IF;
END $$;

-- For usage_analytics table
DO $$ 
BEGIN
  -- Analytics SELECT policy
  IF NOT policy_exists('Users can view their own analytics', 'usage_analytics') THEN
    CREATE POLICY "Users can view their own analytics"
      ON usage_analytics FOR SELECT
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can view their own analytics';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can view their own analytics';
  END IF;
  
  -- Analytics INSERT policy
  IF NOT policy_exists('Users cannot insert analytics', 'usage_analytics') THEN
    CREATE POLICY "Users cannot insert analytics"
      ON usage_analytics FOR INSERT
      WITH CHECK (false);
    RAISE NOTICE 'Created policy: Users cannot insert analytics';
  ELSE
    RAISE NOTICE 'Policy already exists: Users cannot insert analytics';
  END IF;
  
  -- Analytics UPDATE policy
  IF NOT policy_exists('Users cannot update analytics', 'usage_analytics') THEN
    CREATE POLICY "Users cannot update analytics"
      ON usage_analytics FOR UPDATE
      USING (false);
    RAISE NOTICE 'Created policy: Users cannot update analytics';
  ELSE
    RAISE NOTICE 'Policy already exists: Users cannot update analytics';
  END IF;
  
  -- Analytics DELETE policy
  IF NOT policy_exists('Users cannot delete analytics', 'usage_analytics') THEN
    CREATE POLICY "Users cannot delete analytics"
      ON usage_analytics FOR DELETE
      USING (false);
    RAISE NOTICE 'Created policy: Users cannot delete analytics';
  ELSE
    RAISE NOTICE 'Policy already exists: Users cannot delete analytics';
  END IF;
END $$;

-- For auth.users table
DO $$ 
BEGIN
  -- Auth users SELECT policy
  IF NOT policy_exists('Users can view their own auth data', 'users') THEN
    CREATE POLICY "Users can view their own auth data"
      ON auth.users FOR SELECT
      USING (auth.uid() = id);
    RAISE NOTICE 'Created policy: Users can view their own auth data';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can view their own auth data';
  END IF;
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS policy_exists(text, text);

-- Final completion notice (wrapped in DO block to avoid syntax error)
DO $$
BEGIN
  RAISE NOTICE 'Security policy check-and-create script completed successfully!';
END $$; 