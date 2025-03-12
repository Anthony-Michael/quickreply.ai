import Stripe from 'stripe';
import { supabaseAdmin, authenticateRequest } from './utils/supabase-admin';
import withRedisRateLimit from './middleware/redis-rate-limit';

// Initialize Stripe with the secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16', // Using a specific API version for stability
    }) 
  : null;

// Define the price IDs for each subscription tier
// These should be set as environment variables and match your Stripe dashboard
const PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_PRO,
  business: process.env.STRIPE_PRICE_BUSINESS,
};

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if Stripe is properly initialized
    if (!stripe) {
      return res.status(500).json({ 
        error: 'Stripe is not properly configured. Check server environment variables.',
        envStatus: {
          hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
          hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
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

    // Extract request parameters
    const { planTier, returnUrl } = req.body;

    if (!planTier) {
      return res.status(400).json({ error: 'Missing planTier parameter' });
    }

    if (!PRICE_IDS[planTier]) {
      console.error(`Invalid plan tier: ${planTier}. Available tiers: ${Object.keys(PRICE_IDS).join(', ')}`);
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    // Get the user's email for the checkout session
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error retrieving user profile:', profileError);
      return res.status(500).json({ error: 'Could not retrieve user profile' });
    }

    if (!profile || !profile.email) {
      return res.status(400).json({ error: 'User profile is missing email information' });
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
    return res.status(500).json({ 
      error: 'Failed to create checkout session', 
      details: error.message
    });
  }
}

// Apply Redis rate limiting to the handler with custom options
export default withRedisRateLimit(handler, {
  // Use custom key generator - include user ID when available for more accurate limits
  keyGenerator: (req) => {
    try {
      // Get JWT token from authorization header
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        // Extract user ID from token if possible
        // This is a simplified example - you might need proper JWT decoding
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
        if (payload.sub) {
          return `user:${payload.sub}`;
        }
      }
    } catch (error) {
      // Fallback to IP address on error
      console.error('Error extracting user ID for rate limiting:', error);
    }

    // Default to IP address
    return req.headers['x-forwarded-for'] || 
           req.socket.remoteAddress || 
           'unknown';
  }
}); 