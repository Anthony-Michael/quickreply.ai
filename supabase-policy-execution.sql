-- Supabase Row Level Security Policy Execution Script
-- Generated: 2025-03-12T03:02:54.133Z
--
-- INSTRUCTIONS:
-- 1. Log in to your Supabase dashboard: https://xielolacmdldnviravvf.supabase.co
-- 2. Go to the SQL Editor
-- 3. Copy and paste this entire script
-- 4. Execute the script
-- 5. Verify the policies were created successfully
--
-- Note: If any statements fail, you can comment them out and re-run the script

-- First drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users cannot insert profiles directly" ON profiles;
DROP POLICY IF EXISTS "Users cannot delete profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view their own email history" ON email_history;
DROP POLICY IF EXISTS "Users can create their own email history" ON email_history;
DROP POLICY IF EXISTS "Users can update their own email history" ON email_history;
DROP POLICY IF EXISTS "Users can delete their own email history" ON email_history;

DROP POLICY IF EXISTS "Users can view their own email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can create their own email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can update their own email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can delete their own email templates" ON email_templates;

DROP POLICY IF EXISTS "Users can view their own subscription events" ON subscription_events;
DROP POLICY IF EXISTS "Users cannot insert subscription events" ON subscription_events;
DROP POLICY IF EXISTS "Users cannot update subscription events" ON subscription_events;
DROP POLICY IF EXISTS "Users cannot delete subscription events" ON subscription_events;

DROP POLICY IF EXISTS "Users can view their own analytics" ON usage_analytics;
DROP POLICY IF EXISTS "Users cannot insert analytics" ON usage_analytics;
DROP POLICY IF EXISTS "Users cannot update analytics" ON usage_analytics;
DROP POLICY IF EXISTS "Users cannot delete analytics" ON usage_analytics;

DROP POLICY IF EXISTS "Users can view their own auth data" ON auth.users;

-- Statement 1
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Statement 2
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

-- Statement 3
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Statement 4
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Statement 5
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;

-- Statement 6
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Statement 7
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Statement 8
CREATE POLICY "Users cannot insert profiles directly"
  ON profiles FOR INSERT
  WITH CHECK (false);

-- Statement 9
CREATE POLICY "Users cannot delete profiles"
  ON profiles FOR DELETE
  USING (false);

-- Statement 10
CREATE POLICY "Users can view their own email history"
  ON email_history FOR SELECT
  USING (auth.uid() = user_id);

-- Statement 11
CREATE POLICY "Users can create their own email history"
  ON email_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Statement 12
CREATE POLICY "Users can update their own email history"
  ON email_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Statement 13
CREATE POLICY "Users can delete their own email history"
  ON email_history FOR DELETE
  USING (auth.uid() = user_id);

-- Statement 14
CREATE POLICY "Users can view their own email templates"
  ON email_templates FOR SELECT
  USING (auth.uid() = user_id);

-- Statement 15
CREATE POLICY "Users can create their own email templates"
  ON email_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Statement 16
CREATE POLICY "Users can update their own email templates"
  ON email_templates FOR UPDATE
  USING (auth.uid() = user_id);

-- Statement 17
CREATE POLICY "Users can delete their own email templates"
  ON email_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Statement 18
CREATE POLICY "Users can view their own subscription events"
  ON subscription_events FOR SELECT
  USING (auth.uid() = user_id);

-- Statement 19
CREATE POLICY "Users cannot insert subscription events"
  ON subscription_events FOR INSERT
  WITH CHECK (false);

-- Statement 20
CREATE POLICY "Users cannot update subscription events"
  ON subscription_events FOR UPDATE
  USING (false);

-- Statement 21
CREATE POLICY "Users cannot delete subscription events"
  ON subscription_events FOR DELETE
  USING (false);

-- Statement 22
CREATE POLICY "Users can view their own analytics"
  ON usage_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- Statement 23
CREATE POLICY "Users cannot insert analytics"
  ON usage_analytics FOR INSERT
  WITH CHECK (false);

-- Statement 24
CREATE POLICY "Users cannot update analytics"
  ON usage_analytics FOR UPDATE
  USING (false);

-- Statement 25
CREATE POLICY "Users cannot delete analytics"
  ON usage_analytics FOR DELETE
  USING (false);

-- Statement 26
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Statement 27
CREATE POLICY "Users can view their own auth data"
  ON auth.users FOR SELECT
  USING (auth.uid() = id);

