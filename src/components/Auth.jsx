// src/components/Auth.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState('sign-in'); // 'sign-in', 'sign-up', 'forgot-password'
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignIn = async e => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    console.log('Attempting to sign in with:', { email });

    try {
      console.log('Calling Supabase auth.signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Sign-in response:', { data, error });

      if (error) {
        throw error;
      }

      if (data?.user) {
        console.log('Sign-in successful for user:', data.user);
        setSuccessMessage('Sign-in successful! Redirecting...');
        // Manually redirect since automatic redirect might not be working
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      setErrorMessage(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async e => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      setSuccessMessage('Check your email for the confirmation link!');
    } catch (error) {
      console.error('Sign-up error:', error);
      setErrorMessage(error.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      alert('Check your email for the password reset link!');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">AI Email Responder</h1>
        <p className="mt-2 text-gray-600">
          {view === 'sign-in'
            ? 'Sign in to your account'
            : view === 'sign-up'
              ? 'Create a new account'
              : 'Reset your password'}
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-3 text-sm text-green-700 bg-green-100 border border-green-300 rounded">
          {successMessage}
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
            onChange={e => setEmail(e.target.value)}
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
              onChange={e => setPassword(e.target.value)}
              className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              placeholder="••••••••"
            />
          </div>
        )}

        <div>
          {view === 'sign-in' && (
            <button
              type="submit"
              onClick={handleSignIn}
              disabled={loading}
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Loading...' : 'Sign in'}
            </button>
          )}

          {view === 'sign-up' && (
            <button
              type="submit"
              onClick={handleSignUp}
              disabled={loading}
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Loading...' : 'Sign up'}
            </button>
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
