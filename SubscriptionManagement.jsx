import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { loadStripe } from '@stripe/stripe-js';
import { updateSubscription } from './stripeService';

// Initialize Stripe (you would replace this with your actual publishable key)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const SubscriptionManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [currentPlan, setCurrentPlan] = useState('');
  const [subscriptionEnd, setSubscriptionEnd] = useState(null);
  const [processingUpgrade, setProcessingUpgrade] = useState(false);

  // Plan details
  const planDetails = {
    free: {
      name: 'Free',
      price: 0,
      responseLimit: 25,
      features: [
        'Basic email templates',
        '7-day email history',
        'Single user account'
      ]
    },
    business: {
      name: 'Business',
      price: 29,
      responseLimit: 250,
      features: [
        'Advanced templates with customization',
        'Unlimited email history',
        'Priority response generation',
        'Basic analytics'
      ]
    },
    premium: {
      name: 'Premium',
      price: 79,
      responseLimit: 1000,
      features: [
        'Team accounts (up to 3 users)',
        'Advanced analytics',
        'API access for integration',
        'Priority support'
      ]
    }
  };

  useEffect(() => {
    async function loadSubscriptionData() {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('Not authenticated');
        }
        
        // Load user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        setUserProfile(profile);
        
        // Set current plan
        setCurrentPlan(profile.subscription_tier);
        
        // Set subscription end date if available
        if (profile.subscription_end_date) {
          setSubscriptionEnd(new Date(profile.subscription_end_date));
        }
      } catch (err) {
        console.error('Error loading subscription data:', err);
        setError('Failed to load subscription data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    }
    
    loadSubscriptionData();
  }, []);

  const handleUpgradeSubscription = async (planTier) => {
    if (planTier === currentPlan) {
      return; // Already on this plan
    }
    
    try {
      setProcessingUpgrade(true);
      
      // Call your serverless function to create a Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planTier,
          returnUrl: window.location.origin + '/account'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }
      
      const { sessionId } = await response.json();
      
      // Redirect to Stripe checkout
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Error upgrading subscription:', err);
      setError('Failed to process subscription upgrade. Please try again later.');
    } finally {
      setProcessingUpgrade(false);
    }
  };

  const handleSubscriptionUpdate = async () => {
    setIsLoading(true);
    try {
      await updateSubscription(userId, newPlan);
      alert('Subscription updated successfully!');
    } catch (error) {
      alert('Error updating subscription: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading subscription data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Subscription Management</h1>
      
      {/* Current Plan Summary */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-600 mb-2">Plan Tier</p>
            <p className="text-xl font-medium">{planDetails[currentPlan]?.name || 'Free'}</p>
          </div>
          
          <div>
            <p className="text-gray-600 mb-2">Monthly Response Limit</p>
            <p className="text-xl font-medium">{planDetails[currentPlan]?.responseLimit || 25}</p>
          </div>
          
          <div>
            <p className="text-gray-600 mb-2">Used This Month</p>
            <p className="text-xl font-medium">{userProfile?.monthly_responses_used || 0}</p>
          </div>
          
          <div>
            <p className="text-gray-600 mb-2">Remaining</p>
            <p className="text-xl font-medium">
              {(planDetails[currentPlan]?.responseLimit || 25) - (userProfile?.monthly_responses_used || 0)}
            </p>
          </div>
          
          {subscriptionEnd && currentPlan !== 'free' && (
            <div className="col-span-1 md:col-span-2">
              <p className="text-gray-600 mb-2">Subscription Renews</p>
              <p className="text-xl font-medium">{formatDate(subscriptionEnd)}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Plan Options */}
      <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Object.entries(planDetails).map(([tier, plan]) => (
          <div 
            key={tier}
            className={`bg-white p-6 rounded-lg shadow ${
              currentPlan === tier ? 'border-2 border-blue-500' : ''
            }`}
          >
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-3xl font-bold mt-2">
                ${plan.price}
                <span className="text-sm text-gray-500">/month</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {plan.responseLimit} responses per month
              </p>
            </div>
            
            <ul className="mb-6 space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg 
                    className="h-5 w-5 text-green-500 mr-2" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => handleUpgradeSubscription(tier)}
              disabled={processingUpgrade || currentPlan === tier}
              className={`w-full py-2 px-4 rounded-md ${
                currentPlan === tier
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}
            >
              {currentPlan === tier
                ? 'Current Plan'
                : `Upgrade to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>
      
      {/* FAQ Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg">When will my subscription renew?</h3>
            <p className="text-gray-600">
              Your subscription will automatically renew on {formatDate(subscriptionEnd)} unless you cancel before that date.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-lg">How do I cancel my subscription?</h3>
            <p className="text-gray-600">
              To cancel your subscription, please contact our support team at support@aiemail-responder.com.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-lg">What happens if I reach my monthly limit?</h3>
            <p className="text-gray-600">
              Once you reach your monthly response limit, you'll need to upgrade to a higher tier or wait until your next billing cycle to generate more responses.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-lg">Can I change plans in the middle of a billing cycle?</h3>
            <p className="text-gray-600">
              Yes, you can upgrade at any time. If you upgrade, you'll be charged the prorated difference for the remainder of your billing cycle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
