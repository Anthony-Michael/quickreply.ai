// src/components/Auth.jsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const Auth = ({ isSignup = false }) => {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [devMode] = useState(process.env.NEXT_PUBLIC_DEV_MODE === 'true');

  // In development mode, handle direct navigation to dashboard
  useEffect(() => {
    if (devMode) {
      const devModeRedirect = () => {
        console.log('Development mode: redirecting to dashboard...');
        // Use direct window.location for more reliable navigation in development mode
        window.localStorage.setItem('quickreply_dev_auth', 'true');
        window.location.href = '/';
      };
      
      // Add button to bypass auth in dev mode
      const addDevButton = document.createElement('button');
      addDevButton.textContent = 'Development Mode: Skip Login';
      addDevButton.className = 'mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500';
      addDevButton.onclick = devModeRedirect;
      
      // Get the form element and append the button
      const form = document.querySelector('form');
      if (form && !document.querySelector('.dev-mode-button')) {
        addDevButton.classList.add('dev-mode-button');
        form.parentNode.insertBefore(addDevButton, form.nextSibling);
      }
    }
  }, [devMode, router]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (devMode) {
        // In development mode, just redirect to dashboard using direct location change
        console.log('Development mode active - bypassing authentication');
        setSuccessMessage('Development mode: logging in automatically...');
        
        // Set a dev auth flag in localStorage to simulate being logged in
        window.localStorage.setItem('quickreply_dev_auth', 'true');
        
        // Use direct location change instead of router for more reliable navigation
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
        
        return;
      }

      if (isSignup) {
        // Sign up
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        // Set up 7-day trial for new users
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7);

        const { error: profileError } = await supabaseClient
          .from('profiles')
          .update({
            subscription_tier: 'trial',
            subscription_end_date: trialEndDate.toISOString(),
            monthly_responses_limit: 250 // Same as Business plan
          })
          .eq('id', data.user.id);

        if (profileError) throw profileError;

        setSuccessMessage('Account created! Check your email for confirmation. You are on a 7-day free trial.');
      } else {
        // Sign in
        const { error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/');
      }
    } catch (error) {
      setErrorMessage(error.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden md:max-w-md">
      <div className="px-6 py-8">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          {isSignup ? 'Create your account' : 'Sign in to your account'}
        </h2>
        
        {devMode && (
          <div className="mt-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
            <p className="font-bold">Development Mode</p>
            <p>Authentication is simulated. Enter any credentials or use the button below.</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : isSignup ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </form>

        {errorMessage && (
          <div className="mt-4 text-center text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-4 text-center text-sm text-green-600">
            {successMessage}
          </div>
        )}

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <a
            href={isSignup ? '/login' : '/signup'}
            className="ml-1 font-medium text-blue-600 hover:text-blue-500"
          >
            {isSignup ? 'Sign in' : 'Sign up'}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Auth;
