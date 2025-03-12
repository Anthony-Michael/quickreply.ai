// pages/api/cron/check-trial-expirations.js
// This endpoint should be called by a cron job scheduler (e.g., Vercel Cron Jobs)
// to check for trials that are about to expire and send reminder emails

import { supabaseAdmin } from '../utils/supabase-admin';
import { sendTrialExpirationReminder } from '../utils/email-service';

// Secret key to validate the request is from an authorized scheduler
const CRON_SECRET = process.env.CRON_SECRET;

// Days before trial expiration to send reminders
const DAYS_BEFORE_EXPIRATION = 3;

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
    // Calculate the date that is DAYS_BEFORE_EXPIRATION days from now
    const targetExpirationDate = new Date();
    targetExpirationDate.setDate(targetExpirationDate.getDate() + DAYS_BEFORE_EXPIRATION);
    
    // Get the start and end of the target date
    const startOfDay = new Date(targetExpirationDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetExpirationDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log(`Checking for trials expiring on ${targetExpirationDate.toISOString().split('T')[0]}`);
    
    // Find trial accounts with expiration in the target range
    const { data: trialAccounts, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, first_name, subscription_tier, subscription_end_date')
      .eq('subscription_tier', 'trial')
      .gte('subscription_end_date', startOfDay.toISOString())
      .lte('subscription_end_date', endOfDay.toISOString());
      
    if (fetchError) {
      console.error('Error fetching trial accounts:', fetchError);
      throw fetchError;
    }
    
    if (!trialAccounts || trialAccounts.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No trial accounts expiring soon',
        processed: 0
      });
    }
    
    console.log(`Found ${trialAccounts.length} trial accounts expiring in ${DAYS_BEFORE_EXPIRATION} days`);
    
    let sentCount = 0;
    let errorCount = 0;
    
    // Process each account and send emails
    for (const account of trialAccounts) {
      try {
        // Send trial expiration reminder
        await sendTrialExpirationReminder(account.id, DAYS_BEFORE_EXPIRATION);
        
        // Log the email event
        await supabaseAdmin
          .from('subscription_events')
          .insert({
            user_id: account.id,
            event_type: 'trial_expiration_reminder_sent',
            metadata: {
              days_remaining: DAYS_BEFORE_EXPIRATION,
              subscription_end_date: account.subscription_end_date
            }
          });
          
        sentCount++;
        console.log(`Sent trial expiration reminder to account ${account.id} (${account.email})`);
      } catch (error) {
        errorCount++;
        console.error(`Error sending trial expiration reminder to account ${account.id}:`, error);
        
        // Log the error to the database
        try {
          await supabaseAdmin
            .from('error_logs')
            .insert({
              error_type: 'trial_reminder_error',
              user_id: account.id,
              details: {
                message: error.message,
                stack: error.stack
              },
              created_at: new Date().toISOString()
            });
        } catch (logError) {
          console.error('Failed to log error to database:', logError);
        }
      }
    }
    
    // Return results
    return res.status(200).json({
      success: true,
      message: 'Trial expiration check completed',
      stats: {
        found: trialAccounts.length,
        reminded: sentCount,
        errors: errorCount
      }
    });
  } catch (error) {
    console.error('Error running trial expiration check:', error);
    
    // Log the error to the database
    try {
      await supabaseAdmin
        .from('error_logs')
        .insert({
          error_type: 'trial_expiration_check_error',
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
      error: 'Failed to process trial expiration check',
      message: error.message
    });
  }
} 