import Stripe from 'stripe';
import { supabaseAdmin, authenticateRequest } from './utils/supabase-admin';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Mapping of subscription tiers to monthly response limits
const TIER_TO_LIMIT = {
  'free': 25,
  'business': 250,
  'premium': 1000,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateRequest(req);
    
    if (authError) {
      return res.status(401).json({ error: authError });
    }

    // Extract the session ID from the request
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    // Verify the session belongs to this user
    if (session.metadata?.userId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized access to subscription data' });
    }

    // Get the plan tier from the session metadata
    const planTier = session.metadata?.planTier;
    
    if (!planTier) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Get current user profile to check if subscription needs to be updated
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: 'Failed to retrieve user profile' });
    }

    // If the subscription in the database doesn't match the checkout session
    // This could happen if the webhook hasn't processed yet
    if (profile.subscription_tier !== planTier || 
        profile.stripe_subscription_id !== session.subscription.id) {
      
      // Update the user's subscription in the database
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_tier: planTier,
          stripe_subscription_id: session.subscription.id,
          monthly_responses_limit: TIER_TO_LIMIT[planTier] || 25,
          subscription_end_date: endDate.toISOString(),
          monthly_responses_used: 0, // Reset usage when upgrading
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('Error updating profile subscription:', updateError);
        return res.status(500).json({ error: 'Failed to update subscription' });
      }
    }

    // Return subscription details to the client
    return res.status(200).json({
      success: true,
      plan: planTier,
      subscriptionId: session.subscription.id,
      responseLimit: TIER_TO_LIMIT[planTier],
      currentPeriodEnd: new Date(session.subscription.current_period_end * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return res.status(500).json({ error: 'Failed to verify subscription' });
  }
} 