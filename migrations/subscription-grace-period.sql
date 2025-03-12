-- Add subscription grace period and payment status tracking to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS grace_period_end_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_failure_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_failure_date TIMESTAMP WITH TIME ZONE;

-- Create email notifications table for tracking email communications
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'system', 'payment', 'marketing', etc.
  status VARCHAR(50) NOT NULL, -- 'sent', 'failed', 'opened', etc.
  message_id VARCHAR(255),
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient ON email_notifications(recipient);
CREATE INDEX IF NOT EXISTS idx_email_notifications_type ON email_notifications(type);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON email_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_payment_status ON profiles(payment_status);
CREATE INDEX IF NOT EXISTS idx_profiles_grace_period_end_date ON profiles(grace_period_end_date);

-- Add comments for documentation
COMMENT ON COLUMN profiles.payment_status IS 'Current payment status: active, past_due, in_grace_period, or canceled';
COMMENT ON COLUMN profiles.grace_period_end_date IS 'Date when grace period ends and account will be downgraded if payment still fails';
COMMENT ON COLUMN profiles.payment_failure_count IS 'Number of consecutive payment failures';
COMMENT ON COLUMN profiles.last_payment_failure_date IS 'Date of the last payment failure';

-- Enable Row Level Security for email_notifications
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow only admin access to email_notifications
-- In production, you would typically only allow system/admin access to this table
CREATE POLICY "Admin users can manage email notifications" 
  ON email_notifications 
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE is_admin = true
  )); 