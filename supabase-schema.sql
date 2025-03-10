-- Schema for AI Email Responder App

-- Create auth schema extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends the default auth.users table)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  monthly_responses_used INTEGER DEFAULT 0,
  monthly_responses_limit INTEGER DEFAULT 25,
  subscription_tier TEXT DEFAULT 'free',
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  business_name TEXT,
  business_description TEXT
);

-- Trigger to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Email history table
CREATE TABLE email_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customer_email TEXT NOT NULL,
  generated_response TEXT NOT NULL,
  context_provided TEXT,
  tone_requested TEXT,
  customer_email_subject TEXT,
  response_time_ms INTEGER
);

-- Row Level Security for email_history
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email history"
  ON email_history FOR SELECT
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can create their own email history"
  ON email_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own email history"
  ON email_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Email templates table
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  tone TEXT,
  context TEXT,
  times_used INTEGER DEFAULT 0
);

-- Row Level Security for email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email templates"
  ON email_templates FOR SELECT
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can create their own email templates"
  ON email_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own email templates"
  ON email_templates FOR UPDATE
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own email templates"
  ON email_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Subscription tracking table
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'subscription_started', 'subscription_renewed', 'subscription_cancelled', 'plan_changed'
  previous_tier TEXT,
  new_tier TEXT,
  amount_paid NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to reset monthly usage at beginning of billing cycle
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET monthly_responses_used = 0,
      updated_at = NOW()
  WHERE subscription_tier != 'free' AND subscription_tier != 'trial';

  UPDATE profiles
  SET monthly_responses_used = 0,
      updated_at = NOW(),
      subscription_tier = 'free',
      subscription_end_date = NULL,
      stripe_subscription_id = NULL
  WHERE subscription_end_date < NOW();

  -- Downgrade trial users to free tier if trial has ended
  UPDATE profiles
  SET subscription_tier = 'free',
      subscription_end_date = NULL,
      monthly_responses_limit = 25
  WHERE subscription_tier = 'trial' AND subscription_end_date < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_subscription_event
  AFTER INSERT ON subscription_events
  FOR EACH ROW EXECUTE FUNCTION reset_monthly_usage();

-- Usage analytics table
CREATE TABLE usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  emails_processed INTEGER NOT NULL DEFAULT 0,
  average_response_length INTEGER,
  total_tokens_used INTEGER,
  unique_customers INTEGER
);

-- Row Level Security for analytics
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics"
  ON usage_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- Create functions for managing usage and subscription
CREATE OR REPLACE FUNCTION increment_response_count(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET monthly_responses_used = monthly_responses_used + 1
  WHERE id = user_uuid;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_usage_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT monthly_responses_used, monthly_responses_limit
  INTO user_record
  FROM profiles
  WHERE id = user_uuid;
  
  RETURN user_record.monthly_responses_used < user_record.monthly_responses_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for setting updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_email_templates
BEFORE UPDATE ON email_templates
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Create index for better performance
CREATE INDEX idx_email_history_user_id ON email_history(user_id);
CREATE INDEX idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX idx_profiles_stripe_subscription_id ON profiles(stripe_subscription_id);
