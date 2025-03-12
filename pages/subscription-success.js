import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import Link from 'next/link';

export default function SubscriptionSuccess() {
  const router = useRouter();
  const user = useUser();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState(null);
  const { session_id } = router.query;

  useEffect(() => {
    if (!user || !session_id) return;

    async function verifyCheckoutSession() {
      try {
        setLoading(true);
        
        // Call API to verify the checkout session was successful
        const response = await fetch('/api/verify-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data?.session?.access_token || ''}`
          },
          body: JSON.stringify({
            sessionId: session_id
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to verify checkout session');
        }

        const data = await response.json();
        setSubscription(data.subscription);
        
      } catch (error) {
        console.error('Error verifying subscription:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    verifyCheckoutSession();
  }, [user, session_id, supabase.auth]);

  // If the user isn't logged in, redirect to login
  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">Verifying your subscription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow p-6">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Subscription Error</h1>
          </div>
          <div className="bg-red-50 p-4 rounded-md mb-6">
            <p className="text-red-700">{error}</p>
          </div>
          <div className="text-center">
            <p className="mb-4 text-gray-600">
              There was a problem verifying your subscription. If you believe this is an error, please contact support.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/subscription-management" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Subscription Management
              </Link>
              <Link href="/support" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow p-6">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Thank You for Your Subscription!</h1>
        </div>
        
        {subscription ? (
          <div className="mb-6">
            <div className="bg-green-50 border border-green-100 p-4 rounded-md mb-4">
              <p className="text-green-800 font-medium">Your subscription is now active!</p>
            </div>
            <div className="border border-gray-200 rounded-md p-4 mb-4">
              <h2 className="font-medium text-gray-900 mb-2">Subscription Details</h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Plan:</div>
                <div className="font-medium">{subscription.plan}</div>
                
                <div className="text-gray-500">Status:</div>
                <div className="font-medium">{subscription.status}</div>
                
                <div className="text-gray-500">Current Period Ends:</div>
                <div className="font-medium">{new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-md mb-6">
            <p className="text-blue-800">
              Your subscription has been processed. It may take a few moments for your account to be updated.
            </p>
          </div>
        )}
        
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            You now have access to all the features of your subscription plan.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/dashboard" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Go to Dashboard
            </Link>
            <Link href="/subscription-management" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Manage Subscription
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 