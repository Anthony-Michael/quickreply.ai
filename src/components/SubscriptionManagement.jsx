import React, { useState, useEffect } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with the publishable key - using conditional to handle SSR
const stripePromise = typeof window !== 'undefined' ? 
  loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : 
  null;

// Add a debug log to check if the key is available
if (typeof window !== 'undefined') {
  console.debug('Stripe key available:', !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.error('Stripe publishable key is missing. Please check environment variables.');
  }
}

const SubscriptionManagement = () => {
  const user = useUser();
  const supabase = useSupabaseClient();
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
      responses: 25,
      features: ['Basic email responses', 'Standard response time', 'Web access only']
    },
    pro: {
      name: 'Pro',
      price: 9.99,
      responses: 100,
      features: ['Advanced email responses', 'Faster response time', 'Priority support', 'Mobile access']
    },
    business: {
      name: 'Business',
      price: 29.99,
      responses: 500,
      features: ['Enterprise-grade responses', 'Instant response time', 'Dedicated support', 'Team management', 'Custom branding']
    },
  };

  useEffect(() => {
    // Only load subscription data when user is available
    if (user) {
      loadSubscriptionData();
    }
  }, [user]); // Add user to dependency array

  async function loadSubscriptionData() {
    if (!user) {
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Default profile to use if database fetch fails
      const defaultProfile = {
        id: user.id,
        subscription_tier: 'free',
        monthly_responses_limit: 25,
        monthly_responses_used: 0,
        subscription_end_date: null
      };

      let profile = defaultProfile;

      try {
        // Load user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          // Continue with default profile
        } else if (profileData) {
          profile = profileData;
        }
      } catch (profileFetchError) {
        console.error('Profile fetch error:', profileFetchError);
        // Continue with default profile
      }

      // Set the current plan and other state
      setUserProfile(profile);
      setCurrentPlan(profile.subscription_tier || 'free');
      setSubscriptionEnd(profile.subscription_end_date);
      
      // If table doesn't exist yet, try to create the profile
      try {
        if (!profile.id) {
          const { error: insertError } = await supabase
            .from('profiles')
            .upsert([defaultProfile]);
            
          if (insertError) {
            console.warn('Could not create profile:', insertError);
          }
        }
      } catch (createError) {
        console.warn('Error creating profile:', createError);
      }
      
      // Load usage statistics or other data you might need
      
    } catch (error) {
      console.error('Error loading subscription data:', error);
      setError('Failed to load subscription data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  const handleUpgradeSubscription = async planTier => {
    if (planTier === currentPlan) {
      return; // Already on this plan
    }

    try {
      setProcessingUpgrade(true);
      setError('');

      // Add error handling for missing Stripe configuration
      if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        console.error('Stripe publishable key is missing');
        setError('Payment processing is not properly configured. Please contact support.');
        setProcessingUpgrade(false);
        return;
      }

      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Authentication required. Please sign in to continue.');
      }

      // Call our API to create a Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          planTier,
          returnUrl: window.location.origin + '/subscription-management',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe checkout
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Could not initialize Stripe. Please check your configuration.');
      }
      
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

  const formatDate = date => {
    if (!date) return 'N/A';

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Current Plan</h2>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <p className="text-xl font-bold text-blue-600">
              {planDetails[currentPlan]?.name || 'Free'} Plan
            </p>
            <p className="text-gray-600 mt-1">
              {planDetails[currentPlan]?.responses || 0} responses per month
            </p>
            {subscriptionEnd && currentPlan !== 'free' && (
              <p className="text-sm text-gray-500 mt-2">
                Renews on {formatDate(subscriptionEnd)}
              </p>
            )}
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800">Usage</h3>
              <p className="text-2xl font-bold">
                {userProfile?.monthly_responses_used || 0}/
                {userProfile?.monthly_responses_limit || 0}
              </p>
              <p className="text-sm text-gray-600">responses used</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Available Plans</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(planDetails).map(([tier, plan]) => (
            <div key={tier} className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className={`p-6 ${currentPlan === tier ? 'bg-blue-50' : ''}`}>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-3xl font-bold mt-2">
                  ${plan.price}
                  <span className="text-sm font-normal text-gray-600">/month</span>
                </p>
                <p className="mt-2 text-gray-600">{plan.responses} responses per month</p>
                
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <div className="mt-6">
                  {currentPlan === tier ? (
                    <button
                      className="w-full py-2 px-4 bg-gray-300 text-gray-700 rounded-md"
                      disabled
                    >
                      Current Plan
                    </button>
                  ) : tier === 'free' ? (
                    <button
                      className="w-full py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600"
                      onClick={() => handleUpgradeSubscription(tier)}
                      disabled={processingUpgrade}
                    >
                      Downgrade
                    </button>
                  ) : (
                    <button
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      onClick={() => handleUpgradeSubscription(tier)}
                      disabled={processingUpgrade}
                    >
                      {processingUpgrade ? 'Processing...' : 'Upgrade'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">How do I upgrade my plan?</h3>
            <p className="mt-1 text-gray-600">
              Simply click the "Upgrade" button on the plan you wish to subscribe to. You'll be redirected to our secure payment
              provider to complete your purchase.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">What happens if I reach my monthly limit?</h3>
            <p className="mt-1 text-gray-600">
              Once you reach your monthly response limit, you won't be able to generate new responses until your plan renews or
              you upgrade to a higher tier.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">How do I cancel my subscription?</h3>
            <p className="mt-1 text-gray-600">
              You can cancel your subscription at any time by contacting our support team. Your plan will remain active until the
              end of your billing period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
