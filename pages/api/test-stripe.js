import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Test environment variables
  const environment = {
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV || 'Not set',
  };

  // Test Stripe connection
  const stripeStatus = {
    initialized: false,
    connection: false,
    error: null
  };

  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16', // Use latest version
      });
      stripeStatus.initialized = true;
      
      // Try a simple Stripe API call
      const customers = await stripe.customers.list({
        limit: 1,
      });
      stripeStatus.connection = true;
    } catch (error) {
      console.error('Stripe connection error:', error);
      stripeStatus.error = error.message;
    }
  } else {
    stripeStatus.error = "STRIPE_SECRET_KEY is not set";
  }

  // Test Supabase connection
  const supabaseStatus = {
    initialized: false,
    connection: false,
    error: null
  };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      supabaseStatus.initialized = true;
      
      // Try a simple Supabase query
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .limit(1);
        
      if (error) throw error;
      supabaseStatus.connection = true;
    } catch (error) {
      console.error('Supabase connection error:', error);
      supabaseStatus.error = error.message;
    }
  } else {
    supabaseStatus.error = "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set";
  }

  // Return the status
  return res.status(200).json({
    status: 'ok',
    environment,
    stripe: stripeStatus,
    supabase: supabaseStatus,
  });
} 