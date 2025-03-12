import React, { useState } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { loadStripe } from '@stripe/stripe-js';
import { useUserProfile, useSubscriptionData } from '../lib/react-query';

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

const PlanCard = ({ title, price, features, isRecommended, buttonText, onClick, isLoading, disabled }) => (
  <div className={`relative bg-white rounded-lg shadow-md p-6 ${isRecommended ? 'border-2 border-blue-500' : ''}`}>
    {isRecommended && (
      <span className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">
        Recommended
      </span>
    )}
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-3xl font-bold mb-4">${price}<span className="text-sm text-gray-600">/month</span></p>
    <ul className="mb-6 space-y-2">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start">
          <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          {feature}
        </li>
      ))}
    </ul>
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
        disabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : isRecommended
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-blue-500 text-white hover:bg-blue-600'
      }`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : (
        buttonText
      )}
    </button>
  </div>
);

const SubscriptionManagement = () => {
  const user = useUser();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [currentPlan, setCurrentPlan] = useState('');
  const [subscriptionEnd, setSubscriptionEnd] = useState(null);
  const [processingUpgrade, setProcessingUpgrade] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

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

  // Get user profile and subscription data using React Query
  const { data: userProfileData, isLoading: profileLoading } = useUserProfile();
  const { data: subscriptionData, isLoading: subscriptionLoading } = useSubscriptionData();
  
  // Determine current plan
  const currentPlanData = subscriptionData?.plan || 'free';
  
  // Loading state
  const isLoading = profileLoading || subscriptionLoading;

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

  // Initialize Stripe checkout
  const handleSubscribe = async (planTier) => {
    setSelectedPlan(planTier);
    setCheckoutLoading(true);
    setError('');

    try {
      // Check if Stripe is properly initialized
      if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        console.error('Stripe publishable key is not set.');
        setError('Unable to process payment. Stripe is not configured.');
        setCheckoutLoading(false);
        return;
      }

      // Get the Stripe instance
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Failed to initialize Stripe.');
      }

      // Get the current session for auth token
      const { data: authData } = await supabase.auth.getSession();
      
      // Create a checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.session?.access_token}`
        },
        body: JSON.stringify({
          planTier,
          returnUrl: window.location.origin
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe checkout
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      setError(error.message || 'Failed to process subscription. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatDate = date => {
    if (!date) return 'N/A';

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  const renderPlanStatus = () => {
    if (isLoading) {
      return (
        <div className="bg-gray-100 p-4 rounded-md mb-6">
          <p className="text-center">Loading subscription data...</p>
        </div>
      );
    }

    if (currentPlanData === 'free') {
      return (
        <div className="bg-gray-100 p-4 rounded-md mb-6">
          <p className="text-center">You are currently on the <span className="font-bold">Free Plan</span>.</p>
          <p className="text-center text-sm text-gray-600 mt-1">Upgrade to access more features and increased limits.</p>
        </div>
      );
    } else {
      return (
        <div className="bg-blue-50 p-4 rounded-md mb-6 border border-blue-200">
          <p className="text-center">
            You are currently on the <span className="font-bold capitalize">{currentPlanData} Plan</span>.
          </p>
          <p className="text-center text-sm text-gray-600 mt-1">
            {subscriptionData?.subscriptionEndDate && (
              <>Next billing date: {new Date(subscriptionData.subscriptionEndDate).toLocaleDateString()}</>
            )}
          </p>
          <div className="mt-2 text-center">
            <p className="text-sm">
              <span className="font-semibold">{subscriptionData?.responsesUsed || 0}</span> of{' '}
              <span className="font-semibold">{subscriptionData?.responseLimit || 0}</span> responses used this month
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 mb-1">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ 
                  width: `${Math.min(((subscriptionData?.responsesUsed || 0) / (subscriptionData?.responseLimit || 1)) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      );
    }
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Subscription Plans</h1>

      {/* Current plan info */}
      {renderPlanStatus()}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Free Plan */}
        <PlanCard
          title="Free"
          price="0"
          features={[
            "25 AI email responses per month",
            "Professional tone generation",
            "Basic templates",
            "Email history (last 30 days)"
          ]}
          buttonText={currentPlanData === 'free' ? 'Current Plan' : 'Downgrade'}
          disabled={currentPlanData === 'free'}
          onClick={() => {}}
        />

        {/* Pro Plan */}
        <PlanCard
          title="Business"
          price="19"
          isRecommended={true}
          features={[
            "250 AI email responses per month",
            "Multiple tone options",
            "Advanced templates",
            "Email history (unlimited)",
            "Priority support"
          ]}
          buttonText={currentPlanData === 'business' ? 'Current Plan' : 'Subscribe'}
          isLoading={checkoutLoading && selectedPlan === 'business'}
          disabled={currentPlanData === 'business'}
          onClick={() => handleSubscribe('business')}
        />

        {/* Business Plan */}
        <PlanCard
          title="Premium"
          price="49"
          features={[
            "1000 AI email responses per month",
            "All tone options",
            "Custom templates",
            "Advanced analytics",
            "24/7 priority support",
            "API access"
          ]}
          buttonText={currentPlanData === 'premium' ? 'Current Plan' : 'Subscribe'}
          isLoading={checkoutLoading && selectedPlan === 'premium'}
          disabled={currentPlanData === 'premium'}
          onClick={() => handleSubscribe('premium')}
        />
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>

        <div className="space-y-4">
          <div className="bg-white rounded-md shadow-sm p-4">
            <h3 className="font-bold">How do I change my plan?</h3>
            <p className="text-gray-700 mt-1">
              You can upgrade your plan at any time by clicking on the "Subscribe" button. 
              To downgrade, please contact our support team.
            </p>
          </div>

          <div className="bg-white rounded-md shadow-sm p-4">
            <h3 className="font-bold">When will I be billed?</h3>
            <p className="text-gray-700 mt-1">
              You'll be billed immediately upon subscribing, and then on the same date each month.
            </p>
          </div>

          <div className="bg-white rounded-md shadow-sm p-4">
            <h3 className="font-bold">Can I cancel my subscription?</h3>
            <p className="text-gray-700 mt-1">
              Yes, you can cancel your subscription at any time. Your plan will remain active until the end of your billing period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
