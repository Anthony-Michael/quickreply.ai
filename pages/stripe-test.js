import React, { useState, useEffect } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { loadStripe } from '@stripe/stripe-js';

export default function StripeTest() {
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState(null);
  const [error, setError] = useState(null);
  const user = useUser();
  const supabase = useSupabaseClient();

  // Environment variables check
  const clientSideEnv = {
    hasStripePublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    stripeKeyValue: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 
      `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 8)}...` :
      'Not available',
    vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV || 'Not set',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
      `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 15)}...` :
      'Not available',
  };

  // Try to load Stripe
  const [stripeLoaded, setStripeLoaded] = useState(false);
  useEffect(() => {
    async function initStripe() {
      try {
        if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
          const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
          const stripe = await stripePromise;
          setStripeLoaded(!!stripe);
        }
      } catch (error) {
        console.error('Error loading Stripe:', error);
        setError(error.message);
      }
    }
    initStripe();
  }, []);

  // Check the test API
  useEffect(() => {
    async function checkApiStatus() {
      try {
        setLoading(true);
        const response = await fetch('/api/test-stripe');
        const data = await response.json();
        setApiStatus(data);
      } catch (error) {
        console.error('Error checking API status:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    checkApiStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Stripe Integration Test</h1>
        
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Client-Side Environment</h2>
          <div className="bg-gray-50 p-4 rounded border">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Environment:</div>
              <div className={`${clientSideEnv.vercelEnv === 'Not set' ? 'text-red-600' : 'text-green-600'}`}>
                {clientSideEnv.vercelEnv}
              </div>
              
              <div className="font-medium">Stripe Key Available:</div>
              <div className={`${clientSideEnv.hasStripePublishableKey ? 'text-green-600' : 'text-red-600'}`}>
                {clientSideEnv.hasStripePublishableKey ? 'Yes' : 'No'}
              </div>
              
              <div className="font-medium">Stripe Key Prefix:</div>
              <div>{clientSideEnv.stripeKeyValue}</div>
              
              <div className="font-medium">Stripe Loaded:</div>
              <div className={`${stripeLoaded ? 'text-green-600' : 'text-red-600'}`}>
                {stripeLoaded ? 'Yes' : 'No'}
              </div>
              
              <div className="font-medium">Supabase URL:</div>
              <div>{clientSideEnv.supabaseUrl}</div>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Server-Side Check</h2>
          {loading ? (
            <div className="text-center py-4">Loading API status...</div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded border border-red-200 text-red-600">
              Error: {error}
            </div>
          ) : apiStatus ? (
            <div className="bg-gray-50 p-4 rounded border">
              <div className="mb-4">
                <h3 className="font-medium mb-2">Environment Variables:</h3>
                <div className="grid grid-cols-2 gap-2 pl-4">
                  {Object.entries(apiStatus.environment).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <div>{key}:</div>
                      <div className={`${value ? 'text-green-600' : 'text-red-600'}`}>
                        {typeof value === 'boolean' ? (value ? 'Available' : 'Missing') : value}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-medium mb-2">Stripe Status:</h3>
                <div className="grid grid-cols-2 gap-2 pl-4">
                  <div>Initialized:</div>
                  <div className={`${apiStatus.stripe.initialized ? 'text-green-600' : 'text-red-600'}`}>
                    {apiStatus.stripe.initialized ? 'Yes' : 'No'}
                  </div>
                  
                  <div>Connection:</div>
                  <div className={`${apiStatus.stripe.connection ? 'text-green-600' : 'text-red-600'}`}>
                    {apiStatus.stripe.connection ? 'Successful' : 'Failed'}
                  </div>
                  
                  {apiStatus.stripe.error && (
                    <>
                      <div>Error:</div>
                      <div className="text-red-600">{apiStatus.stripe.error}</div>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Supabase Status:</h3>
                <div className="grid grid-cols-2 gap-2 pl-4">
                  <div>Initialized:</div>
                  <div className={`${apiStatus.supabase.initialized ? 'text-green-600' : 'text-red-600'}`}>
                    {apiStatus.supabase.initialized ? 'Yes' : 'No'}
                  </div>
                  
                  <div>Connection:</div>
                  <div className={`${apiStatus.supabase.connection ? 'text-green-600' : 'text-red-600'}`}>
                    {apiStatus.supabase.connection ? 'Successful' : 'Failed'}
                  </div>
                  
                  {apiStatus.supabase.error && (
                    <>
                      <div>Error:</div>
                      <div className="text-red-600">{apiStatus.supabase.error}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>No API data available</div>
          )}
        </div>
        
        <div className="mt-8 flex justify-end">
          <a 
            href="/subscription-management" 
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Go to Subscription Management →
          </a>
        </div>
      </div>
    </div>
  );
} 