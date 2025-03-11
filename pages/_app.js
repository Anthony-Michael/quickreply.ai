import React, { useState, useEffect } from 'react';
import '../styles/globals.css';
import '../styles/output.css';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import Navigation from '../src/components/Navigation';

function MyApp({ Component, pageProps }) {
  // Environment detection
  const [environment, setEnvironment] = useState('production');
  
  // Check environment on client-side render
  useEffect(() => {
    // Use Vercel environment variable if available
    if (process.env.NEXT_PUBLIC_VERCEL_ENV) {
      setEnvironment(process.env.NEXT_PUBLIC_VERCEL_ENV);
    } else {
      // Fallback to hostname detection
      const hostname = window.location.hostname;
      if (hostname.includes('staging') || hostname.includes('preview') || 
          hostname.includes('test') || hostname.includes('localhost')) {
        setEnvironment(hostname.includes('staging') ? 'staging' : 
                      hostname.includes('preview') ? 'preview' : 
                      hostname.includes('localhost') ? 'development' : 'test');
      }
    }
  }, []);

  // Check for development mode from environment variables or process.env.NODE_ENV
  const isDevelopmentMode = () => {
    if (typeof window !== 'undefined') {
      // Client-side check
      // First check localStorage
      if (localStorage.getItem('quickreply_dev_auth') === 'true') {
        return true;
      }
      // Then check environment variable
      if (process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true') {
        return true;
      }
    }
    
    // Server-side or fallback check
    return process.env.NODE_ENV === 'development';
  };

  const isDev = isDevelopmentMode();
  const [isClient, setIsClient] = useState(false);
  const [devAuth, setDevAuth] = useState(false);
  
  // Initialize state on client-side render
  useEffect(() => {
    setIsClient(true);
    if (isDev && typeof window !== 'undefined') {
      const hasDevAuth = window.localStorage.getItem('quickreply_dev_auth') === 'true';
      setDevAuth(hasDevAuth);
      console.log('Development mode authentication state:', hasDevAuth ? 'Logged in' : 'Not logged in');
    }
  }, [isDev]);

  // Create Supabase client with proper error handling for development
  const [supabaseClient] = useState(() => {
    try {
      return createClientComponentClient();
    } catch (error) {
      console.warn('Error creating Supabase client:', error);
      // Return a minimal mock client for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock Supabase client in development mode');
        return {
          auth: {
            getSession: () => Promise.resolve({ 
              data: { 
                session: isDev ? {
                  user: { id: 'dev-user-id', email: 'dev@example.com' },
                  access_token: 'dev-token'
                } : null 
              } 
            }),
            getUser: () => Promise.resolve({ data: { user: isDev ? { id: 'dev-user-id', email: 'dev@example.com' } : null } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signOut: () => Promise.resolve(),
            signInWithPassword: () => Promise.resolve({ data: { user: { id: 'dev-user-id', email: 'dev@example.com' } } }),
            signUp: () => Promise.resolve({ data: { user: { id: 'dev-user-id', email: 'dev@example.com' } } })
          },
          from: () => ({
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: [] }),
                  single: () => Promise.resolve({ data: null })
                }),
                single: () => Promise.resolve({ data: null })
              })
            }),
            insert: () => Promise.resolve({ data: null }),
            update: () => Promise.resolve({ data: null }),
            upsert: () => Promise.resolve({ data: null })
          })
        };
      }
      return null;
    }
  });

  // Show login screen in development mode if not authenticated
  if (isDev && isClient && !devAuth && 
      (pageProps.pathname === '/' || 
       pageProps.pathname === '/dashboard' || 
       pageProps.pathname === '/compose' || 
       pageProps.pathname === '/profile' || 
       pageProps.pathname === '/subscription')) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-2xl font-bold mb-4">Development Mode</h1>
        <p className="mb-4">
          You're not logged in. Please <a href="/login" className="text-blue-600 hover:underline">sign in</a> to continue.
        </p>
      </div>
    );
  }

  // In development, provide a simple UI when Supabase client is not available
  if (!supabaseClient && process.env.NODE_ENV === 'development') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-2xl font-bold mb-4">Development Mode</h1>
        <p className="mb-4">
          Running in development mode without Supabase connection. 
          Check your .env.local file for proper credentials.
        </p>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Component {...pageProps} />
        </div>
      </div>
    );
  }

  // Check if the current page is a mock page
  const isMockPage = (pathname) => {
    return pathname && pathname.startsWith('/mock');
  };

  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={pageProps.initialSession}>
      <div className="min-h-screen bg-gray-50">
        {/* Environment Banner - Only shown in non-production environments */}
        {environment !== 'production' && (
          <div className={`sticky top-0 z-50 w-full p-2 text-white text-center text-sm font-medium ${
            environment === 'staging' ? 'bg-purple-600' : 
            environment === 'preview' ? 'bg-blue-600' : 
            environment === 'development' ? 'bg-green-600' : 'bg-orange-600'
          }`}>
            {environment.toUpperCase()} ENVIRONMENT
          </div>
        )}
        {!isMockPage(pageProps.pathname) && <Navigation />}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Component {...pageProps} />
        </div>
      </div>
    </SessionContextProvider>
  );
}

// Add this to get the current pathname
MyApp.getInitialProps = async ({ Component, ctx }) => {
  let pageProps = {};
  
  if (Component.getInitialProps) {
    pageProps = await Component.getInitialProps(ctx);
  }
  
  pageProps.pathname = ctx.pathname || null;
  
  return { pageProps };
};

export default MyApp; 