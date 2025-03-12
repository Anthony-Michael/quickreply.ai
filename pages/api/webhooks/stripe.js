import Stripe from 'stripe';
import { buffer } from 'micro';
import { supabaseAdmin } from '../utils/supabase-admin';
import { 
  sendPaymentFailureNotification, 
  sendGracePeriodWarning,
  sendDowngradeNotification 
} from '../utils/email-service';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Disable body parsing, we need the raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimit = {
  requests: {},
  maxRequests: 100, // Maximum requests allowed in the time window
  timeWindow: 60 * 1000, // 1 minute in milliseconds
  
  checkLimit: function(ip) {
    const now = Date.now();
    
    // Initialize or clean up old requests
    if (!this.requests[ip] || now - this.requests[ip].timestamp > this.timeWindow) {
      this.requests[ip] = {
        count: 0,
        timestamp: now
      };
    }
    
    // Check if over limit
    if (this.requests[ip].count >= this.maxRequests) {
      return false;
    }
    
    // Increment count
    this.requests[ip].count++;
    return true;
  }
};

// Mapping of Stripe product IDs to subscription tiers
const PRODUCT_TO_TIER = {
  'prod_businessXXXXXXX': 'business', // Replace with actual product ID from Stripe
  'prod_premiumXXXXXXX': 'premium',    // Replace with actual product ID from Stripe
};

// Mapping of subscription tiers to monthly response limits
const TIER_TO_LIMIT = {
  'free': 25,
  'business': 250,
  'premium': 1000,
};

// Number of days to give users as a grace period when payment fails
const GRACE_PERIOD_DAYS = 14;

// List of allowed event types we want to process
const ALLOWED_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
  'invoice.payment_succeeded',
  'customer.subscription.trial_will_end'
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting check
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (!rateLimit.checkLimit(clientIp)) {
    console.warn(`Rate limit exceeded for IP: ${clientIp}`);
    return res.status(429).json({ error: 'Too many requests, please try again later' });
  }

  try {
    // Get the raw body and signature from the request
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
      // Log detailed error information
      console.error('Webhook signature verification failed:', {
        error: err.message,
        signatureHeader: signature.substring(0, 10) + '...',  // Log partial signature for debugging
        errorStack: err.stack
      });
      
      // Return a 403 Forbidden status for invalid signatures
      return res.status(403).json({ 
        error: 'Forbidden: Invalid webhook signature',
        message: `Webhook signature verification failed: ${err.message}`
      });
    }

    console.log('Webhook signature verified successfully', {
      eventId: event.id,
      eventType: event.type
    });
    
    // Verify this is an event type we're interested in processing
    if (!ALLOWED_EVENTS.includes(event.type)) {
      console.warn(`Ignoring unhandled event type: ${event.type}`);
      // Return 200 to acknowledge receipt but take no action
      return res.status(200).json({ received: true, processed: false, message: 'Event type not processed' });
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Extract the user ID and plan tier from the metadata
        const { userId, planTier } = session.metadata;
        
        if (!userId || !planTier) {
          console.error('Missing userId or planTier in session metadata');
          return res.status(400).json({ error: 'Invalid webhook data' });
        }
        
        // Update the user's subscription in the database
        await handleSubscriptionUpdated(
          userId,
          planTier,
          session.subscription,
          TIER_TO_LIMIT[planTier] || 25,
          'active',  // Set payment status to active for new subscriptions
          null       // Clear any grace period
        );
        
        console.log(`Subscription created for user ${userId} on ${planTier} plan`);
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
          .select('id, payment_status')
          .eq('stripe_customer_id', customerId)
          .single();
          
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          break;
        }
        
        // Determine payment status based on subscription status
        let paymentStatus = 'active';
        let gracePeriodEndDate = null;
        
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          // If subscription is active/trialing and was previously in grace period, clear it
          paymentStatus = 'active';
          gracePeriodEndDate = null;
          
          // If payment was previously failing, reset failure count
          if (profile.payment_status !== 'active') {
            await supabaseAdmin
              .from('profiles')
              .update({
                payment_failure_count: 0,
                last_payment_failure_date: null
              })
              .eq('id', profile.id);
          }
        } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
          // Keep existing status if it's already in grace period
          if (profile.payment_status === 'in_grace_period') {
            paymentStatus = 'in_grace_period';
          } else {
            paymentStatus = 'past_due';
          }
        } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
          paymentStatus = 'canceled';
        }
        
        // Update the user's subscription in the database
        await handleSubscriptionUpdated(
          profile.id,
          planTier,
          subscription.id,
          TIER_TO_LIMIT[planTier] || 25,
          paymentStatus,
          gracePeriodEndDate
        );
        
        console.log(`Subscription updated for user ${profile.id} on ${planTier} plan, payment status: ${paymentStatus}`);
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
        await handleSubscriptionUpdated(
          profile.id,
          'free',
          null,
          TIER_TO_LIMIT['free'] || 25,
          'active',  // Free tier is considered active
          null       // No grace period for free tier
        );
        
        console.log(`Subscription deleted for user ${profile.id}, downgraded to free tier`);
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        
        // If this isn't for a subscription, ignore it
        if (!invoice.subscription) {
          console.log('Ignoring non-subscription invoice payment failure');
          break;
        }
        
        // Get the customer ID
        const customerId = invoice.customer;
        
        // Look up the user by Stripe customer ID
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id, email, subscription_tier, payment_failure_count, last_payment_failure_date, payment_status, grace_period_end_date')
          .eq('stripe_customer_id', customerId)
          .single();
          
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          break;
        }
        
        // Increment payment failure count
        const paymentFailureCount = (profile.payment_failure_count || 0) + 1;
        const lastPaymentFailureDate = new Date().toISOString();
        
        // First payment failure - set grace period
        let gracePeriodEndDate = profile.grace_period_end_date;
        let paymentStatus = profile.payment_status;
        
        // If this is the first failure or there's no current grace period, set one
        if (paymentFailureCount === 1 || (paymentStatus !== 'in_grace_period' && !gracePeriodEndDate)) {
          // Calculate grace period end date (14 days from now)
          const gracePeriodEnd = new Date();
          gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);
          gracePeriodEndDate = gracePeriodEnd.toISOString();
          paymentStatus = 'in_grace_period';
          
          console.log(`Setting grace period for user ${profile.id} until ${gracePeriodEndDate}`);
        }
        
        // Update the user's profile with payment failure information
        await supabaseAdmin
          .from('profiles')
          .update({
            payment_failure_count: paymentFailureCount,
            last_payment_failure_date: lastPaymentFailureDate,
            payment_status: paymentStatus,
            grace_period_end_date: gracePeriodEndDate
          })
          .eq('id', profile.id);
          
        console.log(`Updated payment failure info for user ${profile.id}: count=${paymentFailureCount}, status=${paymentStatus}`);
        
        // Record the payment failure event
        await supabaseAdmin
          .from('subscription_events')
          .insert({
            user_id: profile.id,
            event_type: 'payment_failed',
            metadata: {
              invoice_id: invoice.id,
              amount_due: invoice.amount_due,
              attempt_count: paymentFailureCount,
              next_payment_attempt: invoice.next_payment_attempt
            }
          });
          
        // Send email notification about the payment failure
        try {
          await sendPaymentFailureNotification(profile.id, {
            amount_due: invoice.amount_due,
            currency: invoice.currency,
            next_payment_attempt: invoice.next_payment_attempt
          });
          
          console.log(`Payment failure email sent to user ${profile.id}`);
        } catch (emailError) {
          console.error(`Failed to send payment failure email to user ${profile.id}:`, emailError);
        }
        
        // Schedule auto-downgrade after grace period if necessary
        // This would typically be handled by a cron job that checks for expired grace periods
        console.log(`Grace period set for user ${profile.id} until ${gracePeriodEndDate}`);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        
        // Only handle subscription invoices
        if (!invoice.subscription) break;
        
        // Get the customer ID
        const customerId = invoice.customer;
        
        // Look up the user by Stripe customer ID
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id, payment_status, grace_period_end_date, payment_failure_count')
          .eq('stripe_customer_id', customerId)
          .single();
          
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          break;
        }
        
        // If the user was in a grace period or had payment failures, reset those
        if (profile.payment_status !== 'active' || profile.grace_period_end_date || profile.payment_failure_count > 0) {
          await supabaseAdmin
            .from('profiles')
            .update({
              payment_status: 'active',
              grace_period_end_date: null,
              payment_failure_count: 0,
              last_payment_failure_date: null
            })
            .eq('id', profile.id);
            
          console.log(`Reset payment status to active for user ${profile.id} after successful payment`);
        }
        
        break;
      }
    }

    // Return a success response
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    
    // Log critical errors to monitoring system (this would be your actual monitoring system in production)
    logCriticalError('stripe_webhook_error', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ error: 'Failed to process webhook' });
  }
}

// Helper function to log critical errors to your monitoring system
function logCriticalError(errorType, details) {
  // In production, this would send to your monitoring/logging service
  // e.g., Sentry, Datadog, CloudWatch, etc.
  console.error('CRITICAL ERROR:', errorType, JSON.stringify(details, null, 2));
  
  // Example of how you might log to a database for audit purposes
  try {
    supabaseAdmin
      .from('error_logs')
      .insert({
        error_type: errorType,
        details: details,
        created_at: new Date().toISOString()
      })
      .then(() => console.log('Error logged to database'))
      .catch(err => console.error('Failed to log error to database:', err));
  } catch (e) {
    console.error('Failed to log critical error:', e);
  }
}

// Helper function to update a user's subscription in the database
async function handleSubscriptionUpdated(userId, planTier, subscriptionId, responseLimit, paymentStatus, gracePeriodEndDate) {
  const transactionId = `sub_update_${new Date().getTime()}_${Math.random().toString(36).substring(2, 10)}`;
  
  console.log(`Transaction ${transactionId}: Updating subscription for user ${userId}`, {
    planTier,
    subscriptionId,
    responseLimit,
    paymentStatus,
    gracePeriodEndDate
  });

  try {
    // Calculate subscription end date (1 month from now)
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    
    // Update the user's profile with the new subscription details
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_tier: planTier,
        stripe_subscription_id: subscriptionId,
        monthly_responses_limit: responseLimit,
        subscription_end_date: endDate.toISOString(),
        payment_status: paymentStatus || 'active',
        grace_period_end_date: gracePeriodEndDate,
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
        event_type: subscriptionId ? 'subscription_updated' : 'subscription_cancelled',
        new_tier: planTier,
        transaction_id: transactionId,
        metadata: {
          payment_status: paymentStatus,
          grace_period_end_date: gracePeriodEndDate
        }
      });
    
    return true;
  } catch (error) {
    console.error(`Transaction ${transactionId}: Failed:`, error);
    throw error;
  }
} 