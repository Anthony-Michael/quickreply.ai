// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// src/components/Auth.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState('sign-in'); // 'sign-in', 'sign-up', 'forgot-password'
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check for authentication redirect response from Google OAuth
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/dashboard');
      }
    });

    // Clean up the listener on component unmount
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      navigate('/dashboard');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      alert('Check your email for the confirmation link!');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      alert('Check your email for the password reset link!');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMessage('');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
          // Store user data in Supabase upon login
          scopes: 'email profile'
        }
      });
      
      if (error) throw error;
      // No need to navigate here as the redirect is handled by Supabase
      // and we have a listener for auth state changes
    } catch (error) {
      setErrorMessage(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">AI Email Responder</h1>
        <p className="mt-2 text-gray-600">
          {view === 'sign-in' ? 'Sign in to your account' :
           view === 'sign-up' ? 'Create a new account' :
           'Reset your password'}
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
          {errorMessage}
        </div>
      )}

      <form className="mt-8 space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
            placeholder="you@example.com"
          />
        </div>

        {(view === 'sign-in' || view === 'sign-up') && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              placeholder="••••••••"
            />
          </div>
        )}

        <div className="space-y-3">
          {view === 'sign-in' && (
            <>
              <button
                type="submit"
                onClick={handleSignIn}
                disabled={loading}
                className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loading ? 'Loading...' : 'Sign in'}
              </button>
              
              <div className="flex items-center justify-center mt-4">
                <div className="flex-grow h-px bg-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">OR</span>
                <div className="flex-grow h-px bg-gray-300"></div>
              </div>
              
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="flex items-center justify-center w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {googleLoading ? (
                  'Loading...'
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                      <g transform="matrix(1, 0, 0, 1, 0, 0)">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </g>
                    </svg>
                    Sign in with Google
                  </>
                )}
              </button>
            </>
          )}
          
          {view === 'sign-up' && (
            <>
              <button
                type="submit"
                onClick={handleSignUp}
                disabled={loading}
                className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loading ? 'Loading...' : 'Sign up'}
              </button>
              
              <div className="flex items-center justify-center mt-4">
                <div className="flex-grow h-px bg-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">OR</span>
                <div className="flex-grow h-px bg-gray-300"></div>
              </div>
              
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="flex items-center justify-center w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {googleLoading ? (
                  'Loading...'
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                      <g transform="matrix(1, 0, 0, 1, 0, 0)">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </g>
                    </svg>
                    Sign up with Google
                  </>
                )}
              </button>
            </>
          )}
          
          {view === 'forgot-password' && (
            <button
              type="submit"
              onClick={handlePasswordReset}
              disabled={loading}
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Loading...' : 'Send reset instructions'}
            </button>
          )}
        </div>
      </form>

      <div className="text-center">
        {view === 'sign-in' ? (
          <>
            <button
              onClick={() => setView('forgot-password')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Forgot your password?
            </button>
            <p className="mt-2">
              Don't have an account?{' '}
              <button
                onClick={() => setView('sign-up')}
                className="text-blue-600 hover:text-blue-800"
              >
                Sign up
              </button>
            </p>
          </>
        ) : (
          <p>
            Already have an account?{' '}
            <button
              onClick={() => setView('sign-in')}
              className="text-blue-600 hover:text-blue-800"
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Auth;
