import Stripe from 'stripe';
import { buffer } from 'micro';
import { supabaseAdmin } from './utils/supabase-admin';
import { corsMiddleware } from './cors-middleware';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Disable body parsing, we need the raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Mapping of subscription tiers to monthly response limits
const TIER_TO_LIMIT = {
  'free': 25,
  'business': 250,
  'premium': 1000,
};

// Mapping of product IDs to subscription tiers (replace with your actual product IDs)
const PRODUCT_TO_TIER = {
  'prod_businessXXXXXXX': 'business',
  'prod_premiumXXXXXXX': 'premium',
};

// Hourly request limits for rate limiting based on subscription tier
const TIER_TO_HOURLY_LIMIT = {
  'free': 10,
  'business': 50,
  'premium': 100,
};

// List of allowed webhook events we want to process
const ALLOWED_EVENTS = [
  'invoice.payment_succeeded',
  'customer.subscription.updated',
  'customer.subscription.deleted',
];

// Define the handler function that will be wrapped with CORS middleware
const stripeWebhookHandler = async (req, res) => {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the raw request body for signature verification
    const rawBody = await buffer(req);
    
    // Validate request body
    if (rawBody.length === 0) {
      console.error('Empty webhook request body');
      return res.status(400).json({ error: 'Empty request body' });
    }
    
    const signature = req.headers['stripe-signature'];

    // Check for missing signature
    if (!signature) {
      console.error('Webhook request missing Stripe signature');
      return res.status(403).json({ 
        error: 'Unauthorized webhook request: Missing Stripe signature header' 
      });
    }

    // Check for missing webhook secret
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET environment variable is not set');
      return res.status(500).json({ 
        error: 'Server configuration error: Webhook secret not configured' 
      });
    }

    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', {
        error: err.message,
        signatureHeader: signature.substring(0, 10) + '...',
        errorStack: err.stack
      });
      
      return res.status(403).json({ 
        error: 'Forbidden: Invalid webhook signature',
        message: `Webhook signature verification failed: ${err.message}`
      });
    }

    console.log('Stripe webhook received:', {
      eventId: event.id,
      eventType: event.type
    });
    
    // Check if this is an event type we want to handle
    if (!ALLOWED_EVENTS.includes(event.type)) {
      console.warn(`Ignoring unhandled event type: ${event.type}`);
      return res.status(200).json({ received: true, processed: false, message: 'Event type not processed' });
    }

    // Handle different event types
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        
        // Only process subscription invoices
        if (invoice.subscription) {
          // Get the subscription details
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const customerId = subscription.customer;
          
          // Get the subscription item and product ID
          const subscriptionItem = subscription.items.data[0];
          if (!subscriptionItem) break;
          
          const productId = subscriptionItem.price.product;
          
          // Get the user's profile from Supabase
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, subscription_tier')
            .eq('stripe_customer_id', customerId)
            .single();
            
          if (profileError) {
            console.error('Error fetching user profile:', profileError);
            break;
          }
          
          // Get the current product tier
          let planTier = profile.subscription_tier;
          
          // Check if we need to update the plan tier based on the product
          if (PRODUCT_TO_TIER[productId] && PRODUCT_TO_TIER[productId] !== planTier) {
            planTier = PRODUCT_TO_TIER[productId];
          }
          
          // Update the subscription end date and ensure active status
          await updateSubscription(
            profile.id,
            planTier,
            subscription.id,
            TIER_TO_LIMIT[planTier] || 25,
            TIER_TO_HOURLY_LIMIT[planTier] || 10,
            true  // Ensure active status for successful payments
          );
          
          console.log(`Payment succeeded for ${profile.id}, subscription remains active`);
        }
        break;
      }
        
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        // Get the subscription item
        const subscriptionItem = subscription.items.data[0];
        if (!subscriptionItem) break;
        
        // Get the product ID and look up the associated tier
        const productId = subscriptionItem.price.product;
        const planTier = PRODUCT_TO_TIER[productId];
        
        if (!planTier) {
          console.error(`Unknown product ID: ${productId}`);
          break;
        }
        
        // Get the customer ID
        const customerId = subscription.customer;
        
        // Look up the user by Stripe customer ID
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id, subscription_tier')
          .eq('stripe_customer_id', customerId)
          .single();
          
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          break;
        }
        
        // Only process tier changes
        if (profile.subscription_tier !== planTier) {
          // Update the user's subscription in the database
          await updateSubscription(
            profile.id,
            planTier,
            subscription.id,
            TIER_TO_LIMIT[planTier] || 25,
            TIER_TO_HOURLY_LIMIT[planTier] || 10,
            subscription.status === 'active'
          );
          
          console.log(`Subscription plan updated for ${profile.id}: ${profile.subscription_tier} -> ${planTier}`);
        }
        break;
      }
        
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Get the customer ID
        const customerId = subscription.customer;
        
        // Look up the user by Stripe customer ID
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();
          
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          break;
        }
        
        // Downgrade the user to the free tier
        await updateSubscription(
          profile.id,
          'free',
          null,  // No subscription ID for free tier
          TIER_TO_LIMIT['free'] || 25,
          TIER_TO_HOURLY_LIMIT['free'] || 10,
          true  // Free tier is always active
        );
        
        console.log(`Subscription cancelled for ${profile.id}, downgraded to free tier`);
        break;
      }
    }

    // Return a success response
    return res.status(200).json({ received: true, processed: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    
    // Log critical error
    try {
      await supabaseAdmin
        .from('error_logs')
        .insert({
          error_type: 'stripe_webhook_error',
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
export default corsMiddleware(stripeWebhookHandler);

/**
 * Updates a user's subscription details in Supabase
 * @param {string} userId - The user's ID
 * @param {string} planTier - The subscription tier (free, business, premium)
 * @param {string|null} subscriptionId - The Stripe subscription ID (null for free tier)
 * @param {number} responseLimit - Monthly response limit
 * @param {number} hourlyLimit - Hourly request limit
 * @param {boolean} isActive - Whether the subscription is active
 */
async function updateSubscription(userId, planTier, subscriptionId, responseLimit, hourlyLimit, isActive) {
  const transactionId = `sub_update_${new Date().getTime()}_${Math.random().toString(36).substring(2, 10)}`;
  
  console.log(`Transaction ${transactionId}: Updating subscription for user ${userId}`, {
    planTier,
    subscriptionId,
    responseLimit,
    hourlyLimit,
    isActive
  });

  try {
    // Calculate subscription end date (1 month from now for active subscriptions)
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    
    // Update the user's profile with the new subscription details
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_tier: planTier,
        stripe_subscription_id: subscriptionId,
        monthly_responses_limit: responseLimit,
        hourly_request_limit: hourlyLimit,
        subscription_status: isActive ? 'active' : 'inactive',
        subscription_end_date: isActive ? endDate.toISOString() : null,
        // Reset usage only when upgrading to a new tier
        ...(planTier !== 'free' && { monthly_responses_used: 0 }),
      })
      .eq('id', userId);
      
    if (error) {
      console.error(`Transaction ${transactionId}: Error updating user subscription:`, error);
      throw error;
    }

    // Log the transaction success
    console.log(`Transaction ${transactionId}: Successfully updated subscription for user ${userId}`);
    
    // Record the subscription event for audit trail
    await supabaseAdmin
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: subscriptionId ? (isActive ? 'subscription_activated' : 'subscription_deactivated') : 'subscription_cancelled',
        new_tier: planTier,
        transaction_id: transactionId
      });
    
    return true;
  } catch (error) {
    console.error(`Transaction ${transactionId}: Failed:`, error);
    throw error;
  }
} 