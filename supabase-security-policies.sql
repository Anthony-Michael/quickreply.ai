-- Supabase Row Level Security Policies
-- This file contains all security policies for the ReplyRocket.io application

-- ===============================================
-- Enable RLS on all tables
-- ===============================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on email_history table
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

-- Enable RLS on email_templates table
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Enable RLS on subscription_events table
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Enable RLS on usage_analytics table
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- Profiles table policies
-- ===============================================

-- Users can read only their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update only their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users cannot insert new profiles (handled by trigger)
CREATE POLICY "Users cannot insert profiles directly"
  ON profiles FOR INSERT
  WITH CHECK (false);

-- Users cannot delete profiles
CREATE POLICY "Users cannot delete profiles"
  ON profiles FOR DELETE
  USING (false);

-- ===============================================
-- Email history table policies
-- ===============================================

-- Users can read only their own email history
CREATE POLICY "Users can view their own email history"
  ON email_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert new email history records, but only with their user_id
CREATE POLICY "Users can create their own email history"
  ON email_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own email history
CREATE POLICY "Users can update their own email history"
  ON email_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete only their own email history
CREATE POLICY "Users can delete their own email history"
  ON email_history FOR DELETE
  USING (auth.uid() = user_id);

-- ===============================================
-- Email templates table policies
-- ===============================================

-- Users can read only their own email templates
CREATE POLICY "Users can view their own email templates"
  ON email_templates FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert new email templates, but only with their user_id
CREATE POLICY "Users can create their own email templates"
  ON email_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own email templates
CREATE POLICY "Users can update their own email templates"
  ON email_templates FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete only their own email templates
CREATE POLICY "Users can delete their own email templates"
  ON email_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ===============================================
-- Subscription events table policies
-- ===============================================

-- Users can read only their own subscription events
CREATE POLICY "Users can view their own subscription events"
  ON subscription_events FOR SELECT
  USING (auth.uid() = user_id);

-- Users cannot insert subscription events directly (handled by server)
CREATE POLICY "Users cannot insert subscription events"
  ON subscription_events FOR INSERT
  WITH CHECK (false);

-- Users cannot update subscription events
CREATE POLICY "Users cannot update subscription events"
  ON subscription_events FOR UPDATE
  USING (false);

-- Users cannot delete subscription events
CREATE POLICY "Users cannot delete subscription events"
  ON subscription_events FOR DELETE
  USING (false);

-- ===============================================
-- Usage analytics table policies
-- ===============================================

-- Users can read only their own analytics
CREATE POLICY "Users can view their own analytics"
  ON usage_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- Users cannot insert analytics directly (handled by server)
CREATE POLICY "Users cannot insert analytics"
  ON usage_analytics FOR INSERT
  WITH CHECK (false);

-- Users cannot update analytics
CREATE POLICY "Users cannot update analytics"
  ON usage_analytics FOR UPDATE
  USING (false);

-- Users cannot delete analytics
CREATE POLICY "Users cannot delete analytics"
  ON usage_analytics FOR DELETE
  USING (false);

-- ===============================================
-- Policy for Supabase Auth
-- ===============================================

-- Allow authenticated users to use the auth API
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own auth data"
  ON auth.users FOR SELECT
  USING (auth.uid() = id); 