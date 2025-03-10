import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const SubscriptionSuccess = () => {
  const router = useRouter();
  const { session_id } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);

  useEffect(() => {
    // Only run this effect when session_id is available
    if (!session_id) return;

    async function verifySubscription() {
      try {
        setLoading(true);
        // Verify the subscription with our API
        const response = await fetch('/api/verify-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
          },
          body: JSON.stringify({ sessionId: session_id }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to verify subscription');
        }

        const data = await response.json();
        setSubscriptionDetails(data);
      } catch (err) {
        console.error('Error verifying subscription:', err);
        setError(err.message || 'An error occurred while verifying your subscription');
      } finally {
        setLoading(false);
      }
    }

    verifySubscription();
  }, [session_id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <h2 className="text-xl font-medium mt-4">Verifying your subscription...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mt-4">Subscription Error</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <div className="mt-6">
              <Link href="/subscription-management">
                <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                  Return to Subscription Management
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mt-4">Subscription Confirmed!</h2>
          <p className="mt-2 text-gray-600">
            Thank you for subscribing to the {subscriptionDetails?.plan || 'Premium'} plan.
          </p>
          <div className="mt-6 bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium text-gray-900">Subscription Details</h3>
            <dl className="mt-2 divide-y divide-gray-200">
              <div className="py-2 flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Plan</dt>
                <dd className="text-sm font-medium text-gray-900">{subscriptionDetails?.plan || 'Premium'}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Monthly Responses</dt>
                <dd className="text-sm font-medium text-gray-900">{subscriptionDetails?.responseLimit || '1,000'}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Billing Period</dt>
                <dd className="text-sm font-medium text-gray-900">Monthly</dd>
              </div>
            </dl>
          </div>
          <div className="mt-6">
            <Link href="/dashboard">
              <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                Go to Dashboard
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess; 