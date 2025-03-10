import { corsMiddleware } from '../cors-middleware';
import { supabaseAdmin } from '../utils/supabase-admin';

/**
 * Handler for usage-related webhooks from Supabase
 */
const usageHandler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify the webhook is from Supabase (implement proper validation here)

    // Get the webhook payload
    const data = req.body;
    
    console.log('Received usage webhook:', {
      type: data.type,
      table: data.table,
      schema: data.schema,
      record: data.record
    });

    // Process based on the webhook type
    switch (data.type) {
      case 'INSERT':
        // Handle new email history records
        if (data.table === 'email_history') {
          const userId = data.record.user_id;
          
          // Get the user's current usage
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('subscription_tier, monthly_responses_used, monthly_responses_limit')
            .eq('id', userId)
            .single();
            
          if (profileError) {
            console.error(`Error fetching profile for user ${userId}:`, profileError);
            break;
          }
          
          console.log(`User ${userId} usage: ${profile.monthly_responses_used}/${profile.monthly_responses_limit}`);
          
          // Check if user is approaching limit
          if (profile.monthly_responses_used >= profile.monthly_responses_limit * 0.8) {
            // Here you might want to send a notification to the user
            console.log(`User ${userId} is approaching their usage limit`);
          }
        }
        break;
        
      default:
        console.log(`Unhandled webhook type: ${data.type}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing usage webhook:', error);
    
    // Log the error
    try {
      await supabaseAdmin
        .from('error_logs')
        .insert({
          error_type: 'usage_webhook_error',
          details: {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }
    
    return res.status(500).json({ error: 'Failed to process webhook' });
  }
};

// Export the wrapped handler with CORS middleware
export default corsMiddleware(usageHandler); 