import Stripe from 'stripe';
import { supabaseAdmin, authenticateRequest } from './utils/supabase-admin';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Define the price IDs for each subscription tier
// These would be created in your Stripe dashboard
const PRICE_IDS = {
  business: 'price_businessXXXXXXX', // Replace with actual price ID from Stripe
  premium: 'price_premiumXXXXXXX',    // Replace with actual price ID from Stripe
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

    // Extract request parameters
    const { planTier, returnUrl } = req.body;

    if (!planTier || !PRICE_IDS[planTier]) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    // Get the user's email for the checkout session
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: 'Could not retrieve user profile' });
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      customer_email: profile.email,
      line_items: [
        {
          price: PRICE_IDS[planTier],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        metadata: {
          userId: user.id,
          planTier,
        },
      },
      metadata: {
        userId: user.id,
        planTier,
      },
      success_url: `${returnUrl || req.headers.origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl || req.headers.origin}/subscription-management`,
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
} 