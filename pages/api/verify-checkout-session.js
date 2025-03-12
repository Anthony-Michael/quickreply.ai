import Stripe from 'stripe';
import { supabaseAdmin, authenticateRequest } from './utils/supabase-admin';

// Initialize Stripe with the secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16', // Using a specific API version for stability
    }) 
  : null;

// Map product IDs to plan names (configure based on your Stripe products)
const PRODUCT_TO_PLAN = {
  // Replace with your actual product IDs
  'prod_proXXXXXXX': 'Pro',
  'prod_businessXXXXXXX': 'Business',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if Stripe is properly initialized
    if (!stripe) {
      return res.status(500).json({ 
        error: 'Stripe is not properly configured. Check server environment variables.',
        envStatus: {
          hasStripeKey: !!process.env.STRIPE_SECRET_KEY
        }
      });
    }

    // Authenticate the request
    const { user, error: authError } = await authenticateRequest(req);
    
    if (authError) {
      console.error('Authentication error:', authError);
      return res.status(401).json({ error: authError });
    }

    if (!user || !user.id) {
      return res.status(401).json({ error: 'User not authenticated or invalid user data' });
    }

    // Extract the session ID
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'subscription.default_payment_method'],
    });

    // Verify the session belongs to this user
    if (session.metadata.userId !== user.id) {
      console.error('Session user ID mismatch', {
        sessionUserId: session.metadata.userId,
        requestUserId: user.id
      });
      return res.status(403).json({ error: 'Unauthorized access to this session' });
    }

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        error: 'Payment has not been completed',
        status: session.payment_status 
      });
    }

    // Get the subscription details
    const subscription = session.subscription;
    if (!subscription) {
      return res.status(400).json({ error: 'No subscription found for this session' });
    }

    // Determine the plan name from the product
    const productId = subscription.items.data[0]?.price.product;
    const planName = PRODUCT_TO_PLAN[productId] || 'Unknown Plan';

    // Update the user's subscription in the database
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_tier: planName.toLowerCase(),
        stripe_customer_id: session.customer,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user profile with subscription details:', updateError);
      return res.status(500).json({ error: 'Failed to update subscription in database' });
    }

    // Return the subscription details
    return res.status(200).json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: planName,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });
  } catch (error) {
    console.error('Error verifying checkout session:', error);
    return res.status(500).json({ 
      error: 'Failed to verify checkout session', 
      details: error.message
    });
  }
} 