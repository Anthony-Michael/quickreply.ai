// pages/api/cron/check-grace-periods.js
// This endpoint should be called by a cron job scheduler (e.g., Vercel Cron Jobs)
// to check for expired grace periods and send reminders

import { supabaseAdmin } from '../utils/supabase-admin';
import { 
  sendGracePeriodWarning, 
  sendDowngradeNotification 
} from '../utils/email-service';

// Tiers and their corresponding limits
const TIER_TO_LIMIT = {
  'free': 25,
  'business': 250,
  'premium': 1000,
};

// Secret key to validate the request is from an authorized scheduler
const CRON_SECRET = process.env.CRON_SECRET;

// Days before expiration to send reminders
const REMINDER_DAYS = [7, 3, 1];

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Validate authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
    console.error('Unauthorized cron job request');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const now = new Date();
    let processedCount = 0;
    let remindedCount = 0;
    let downgradedCount = 0;
    
    // Find accounts in grace period
    const { data: gracePeriodAccounts, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('payment_status', 'in_grace_period')
      .not('grace_period_end_date', 'is', null);
      
    if (fetchError) {
      console.error('Error fetching accounts in grace period:', fetchError);
      throw fetchError;
    }
    
    if (!gracePeriodAccounts || gracePeriodAccounts.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No accounts in grace period found',
        processed: 0
      });
    }
    
    console.log(`Found ${gracePeriodAccounts.length} accounts in grace period`);
    
    // Process each account
    for (const account of gracePeriodAccounts) {
      processedCount++;
      
      // Parse the grace period end date
      const graceEndDate = new Date(account.grace_period_end_date);
      
      // Calculate days until grace period ends
      const daysRemaining = Math.ceil((graceEndDate - now) / (1000 * 60 * 60 * 24));
      
      // If grace period has expired, downgrade the account
      if (now >= graceEndDate) {
        try {
          // Downgrade to free tier
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_tier: 'free',
              monthly_responses_limit: TIER_TO_LIMIT['free'],
              payment_status: 'canceled',
              grace_period_end_date: null,
              stripe_subscription_id: null
            })
            .eq('id', account.id);
            
          // Log the downgrade
          await supabaseAdmin
            .from('subscription_events')
            .insert({
              user_id: account.id,
              event_type: 'account_downgraded_after_grace_period',
              previous_tier: account.subscription_tier,
              new_tier: 'free'
            });
            
          // Send downgrade notification email
          await sendDowngradeNotification(account.id);
          
          downgradedCount++;
          console.log(`Downgraded account ${account.id} to free tier after grace period expiration`);
        } catch (error) {
          console.error(`Error downgrading account ${account.id}:`, error);
        }
      } 
      // If grace period is approaching, send a reminder
      else if (REMINDER_DAYS.includes(daysRemaining)) {
        try {
          // Send reminder email
          await sendGracePeriodWarning(account.id, daysRemaining);
          
          // Log the reminder
          await supabaseAdmin
            .from('subscription_events')
            .insert({
              user_id: account.id,
              event_type: 'grace_period_reminder_sent',
              metadata: {
                days_remaining: daysRemaining,
                grace_period_end_date: account.grace_period_end_date
              }
            });
            
          remindedCount++;
          console.log(`Sent grace period reminder to account ${account.id} with ${daysRemaining} days remaining`);
        } catch (error) {
          console.error(`Error sending reminder to account ${account.id}:`, error);
        }
      }
    }
    
    // Return results
    return res.status(200).json({
      success: true,
      message: 'Grace period check completed',
      stats: {
        processed: processedCount,
        reminded: remindedCount,
        downgraded: downgradedCount
      }
    });
  } catch (error) {
    console.error('Error running grace period check:', error);
    
    // Log the error to the database
    try {
      await supabaseAdmin
        .from('error_logs')
        .insert({
          error_type: 'grace_period_check_error',
          details: {
            message: error.message,
            stack: error.stack
          },
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }
    
    return res.status(500).json({
      error: 'Failed to process grace period check',
      message: error.message
    });
  }
} 