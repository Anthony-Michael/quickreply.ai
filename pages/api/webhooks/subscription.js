import { corsMiddleware } from '../cors-middleware';
import { supabaseAdmin } from '../utils/supabase-admin';

/**
 * Handler for subscription-related webhooks from Supabase
 */
const subscriptionHandler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify the webhook is from Supabase (implement proper validation here)
    // You may want to add webhook signing validation similar to Stripe

    // Get the webhook payload
    const data = req.body;
    
    console.log('Received subscription webhook:', {
      type: data.type,
      table: data.table,
      schema: data.schema,
      record: data.record
    });

    // Process based on the webhook type
    switch (data.type) {
      case 'UPDATE':
        // Handle subscription updates
        if (data.table === 'profiles' && data.record.subscription_tier) {
          console.log(`User ${data.record.id} subscription updated to ${data.record.subscription_tier}`);
          
          // Perform any additional processing needed
        }
        break;
        
      case 'INSERT':
        // Handle new subscription records
        console.log(`New subscription record created for user ${data.record.user_id}`);
        break;
        
      default:
        console.log(`Unhandled webhook type: ${data.type}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing subscription webhook:', error);
    
    // Log the error
    try {
      await supabaseAdmin
        .from('error_logs')
        .insert({
          error_type: 'subscription_webhook_error',
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
export default corsMiddleware(subscriptionHandler); 