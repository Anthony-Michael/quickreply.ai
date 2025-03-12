import React, { useState, useEffect, Component } from 'react';
import '../styles/globals.css';
import '../styles/output.css';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import Navigation from '../src/components/Navigation';
import { QueryProvider } from '../src/lib/react-query';

// Error boundary component to catch rendering errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="mb-4">
              We're having trouble loading this page. Our team has been notified.
            </p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
            >
              Try again
            </button>
            {process.env.NODE_ENV !== 'production' && (
              <div className="mt-4 p-4 border border-gray-300 rounded bg-gray-50 overflow-auto">
                <p className="font-mono text-sm text-red-600">{this.state.error && this.state.error.toString()}</p>
                <pre className="mt-2 font-mono text-xs overflow-auto">
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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

  // Add global error handler for fetch/API calls
  useEffect(() => {
    const handleGlobalErrors = (event) => {
      // Log the error for debugging
      console.error('Global error caught:', event.error);
      
      // Prevent the default browser error handling
      event.preventDefault();
      
      // Here you could send the error to a monitoring service like Sentry
      // if (typeof window.Sentry !== 'undefined') {
      //   window.Sentry.captureException(event.error);
      // }
    };
    
    window.addEventListener('error', handleGlobalErrors);
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Prevent the default
      event.preventDefault();
    });
    
    return () => {
      window.removeEventListener('error', handleGlobalErrors);
      window.removeEventListener('unhandledrejection', handleGlobalErrors);
    };
  }, []);

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

  // Wrap the application rendering in a try-catch block
  try {
    return (
      <ErrorBoundary>
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
              <Component {...pageProps} fallback={
                <div className="p-4 bg-gray-100 rounded-md">
                  <p>Loading content...</p>
                </div>
              } />
            </div>
          </div>
        </SessionContextProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error("Error rendering application:", error);
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Unexpected Error</h1>
          <p className="mb-4">
            We encountered an issue while loading the application. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }
}

// Add this to get the current pathname
MyApp.getInitialProps = async ({ Component, ctx }) => {
  try {
    let pageProps = {};
    
    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
    }
    
    pageProps.pathname = ctx.pathname || null;
    
    return { pageProps };
  } catch (error) {
    console.error("Error in getInitialProps:", error);
    return { pageProps: { 
      pathname: ctx.pathname || null,
      error: true
    }};
  }
};

export default MyApp; 