import React from 'react';
import Link from 'next/link';

// Mock Navigation component
const MockNavigation = () => (
  <nav className="bg-blue-700 text-white shadow-sm py-1">
    <div className="max-w-7xl mx-auto px-2">
      <div className="flex items-center justify-between h-6">
        <div className="flex items-center">
          <Link href="/mock" className="flex-shrink-0 font-bold text-xs">
            QuickReply.ai
          </Link>
          <div className="hidden md:block">
            <div className="ml-2 flex items-center space-x-0.5">
              <Link
                href="/mock"
                className="px-1.5 py-0.5 rounded-sm text-xs font-medium transition-colors duration-150 text-white hover:bg-blue-600"
              >
                Dashboard
              </Link>
              <Link
                href="/mock/compose"
                className="px-1.5 py-0.5 rounded-sm text-xs font-medium transition-colors duration-150 text-white hover:bg-blue-600"
              >
                Email Composer
              </Link>
              <Link
                href="/mock/subscription"
                className="px-1.5 py-0.5 rounded-sm text-xs font-medium transition-colors duration-150 bg-blue-600 text-white"
              >
                Subscription
              </Link>
              <Link
                href="/mock/profile"
                className="px-1.5 py-0.5 rounded-sm text-xs font-medium transition-colors duration-150 text-white hover:bg-blue-600"
              >
                Profile
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="ml-1 flex items-center">
            <span className="text-xs mr-1">
              test@example.com
              <span className="bg-yellow-400 text-xs text-black px-1 ml-1 rounded">MOCK</span>
            </span>
            <Link
              href="/mock"
              className="px-1.5 py-0.5 border border-transparent text-xs font-medium rounded-sm
                       text-white bg-blue-600 hover:bg-blue-500 transition-colors duration-150"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </div>
    </div>
  </nav>
);

// Plans data for the pricing section
const plans = [
  {
    name: 'Free',
    description: 'For individuals just getting started',
    price: 'Free',
    features: [
      '25 email responses per month',
      'Basic styling options',
      'Limited AI customization',
      'Email support'
    ],
    current: false,
    buttonText: 'Current Plan',
    buttonClass: 'bg-gray-400 hover:bg-gray-500'
  },
  {
    name: 'Professional',
    description: 'Perfect for growing businesses',
    price: '$29/month',
    features: [
      '250 email responses per month',
      'Advanced styling options',
      'Business customization',
      'Priority email support',
      'Response templates library'
    ],
    current: true,
    buttonText: 'Current Plan',
    buttonClass: 'bg-blue-600 hover:bg-blue-700'
  },
  {
    name: 'Enterprise',
    description: 'For high-volume businesses',
    price: '$99/month',
    features: [
      'Unlimited email responses',
      'Custom styling options',
      'Advanced business customization',
      'Priority phone support',
      'Response templates library',
      'Analytics dashboard',
      'Multiple team members'
    ],
    current: false,
    buttonText: 'Upgrade',
    buttonClass: 'bg-blue-600 hover:bg-blue-700'
  }
];

// Mock Subscription Page
export default function MockSubscription() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* This wrapper div prevents the global Navigation from _app.js from being displayed */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <MockNavigation />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
          <h2 className="font-bold text-lg">Mock Mode</h2>
          <p>This is a static mock of the Subscription page for testing purposes. No authentication or API calls are being made.</p>
          <p className="mt-2">
            View other pages:
            <Link href="/mock" className="text-blue-600 hover:underline ml-2">Dashboard</Link>
            <Link href="/mock/compose" className="text-blue-600 hover:underline ml-2">Email Composer</Link>
            <Link href="/mock/profile" className="text-blue-600 hover:underline ml-2">Profile</Link>
          </p>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Choose the perfect plan for your business needs
          </p>
        </div>

        {/* Usage Summary */}
        <div className="max-w-3xl mx-auto mb-10 bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900">Current Usage</h2>
            <div className="mt-5">
              <div className="flex justify-between text-sm font-medium text-gray-900">
                <p>Email Responses (This Month)</p>
                <p>124 / 250</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: '50%' }}
                ></div>
              </div>
              <p className="mt-2 text-sm text-gray-500">Your plan resets on May 30, 2023</p>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div 
                key={plan.name} 
                className={`rounded-lg shadow-lg overflow-hidden bg-white ${plan.current ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900">{plan.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                  <p className="mt-4">
                    <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                  </p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="ml-3 text-sm text-gray-700">{feature}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <button
                      className={`w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${plan.buttonClass} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${plan.current ? 'cursor-default' : ''}`}
                      onClick={() => alert(plan.current ? 'This is your current plan' : 'This is a mock interface. Subscription upgrade is not available.')}
                    >
                      {plan.buttonText}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Billing History */}
        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Billing History</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul>
              <li className="border-b border-gray-200">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-blue-600 truncate">
                      Invoice #2023-04
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Paid
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Professional Plan - $29.00
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        April 01, 2023
                      </p>
                    </div>
                  </div>
                </div>
              </li>
              <li className="border-b border-gray-200">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-blue-600 truncate">
                      Invoice #2023-03
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Paid
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Professional Plan - $29.00
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        March 01, 2023
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Method */}
        <div className="max-w-3xl mx-auto mt-10 bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900">Payment Method</h2>
            <div className="mt-5 flex items-center">
              <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <path d="M22 10H2" />
              </svg>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Visa ending in 4242</p>
                <p className="text-sm text-gray-500">Expires 12/2024</p>
              </div>
              <button 
                className="ml-auto text-sm text-blue-600 hover:text-blue-800"
                onClick={() => alert('This is a mock interface. Payment method update is not available.')}
              >
                Update
              </button>
            </div>
          </div>
        </div>

        {/* Cancel Subscription */}
        <div className="max-w-3xl mx-auto mt-6 bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Cancel Subscription</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Your subscription will remain active until the end of your current billing period. After that, your account will be downgraded to the Free plan.
              </p>
            </div>
            <div className="mt-5">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={() => alert('This is a mock interface. Subscription cancellation is not available.')}
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 