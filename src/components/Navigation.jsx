import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [devMode] = useState(process.env.NEXT_PUBLIC_DEV_MODE === 'true');
  const [isClient, setIsClient] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  
  // Initialize client-side state and get router only on client side
  const router = typeof window !== 'undefined' ? useRouter() : null;
  const user = useUser();
  const supabaseClient = useSupabaseClient();
  
  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    if (router) {
      setCurrentPath(router.pathname);
    }
  }, [router?.pathname]);

  const handleSignOut = async () => {
    if (devMode) {
      // In development mode, just clear localStorage and redirect
      console.log('Development mode: signing out');
      localStorage.removeItem('quickreply_dev_auth');
      window.location.href = '/login';
      return;
    }
    
    await supabaseClient.auth.signOut();
    if (router) {
      router.push('/login');
    } else {
      window.location.href = '/login';
    }
  };

  const isActive = path => {
    return currentPath === path ? 'bg-blue-600 text-white' : 'text-white hover:bg-blue-600';
  };

  // Don't render anything until client-side hydration completes
  if (!isClient) {
    return null;
  }

  // Don't show navigation on auth pages
  if (currentPath === '/login' || currentPath === '/signup') {
    return null;
  }

  // Check for development mode authentication
  const hasDevAuth = devMode && localStorage.getItem('quickreply_dev_auth') === 'true';
  const isAuthenticated = user || hasDevAuth;
  
  // If not authenticated in any way, don't show the navigation
  if (!isAuthenticated && !devMode) {
    if (router) {
      router.push('/login');
    }
    return null;
  }

  return (
    <nav className="bg-blue-700 text-white shadow-sm py-1">
      <div className="max-w-7xl mx-auto px-2">
        <div className="flex items-center justify-between h-6">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 font-bold text-xs">
              QuickReply.ai
            </Link>
            <div className="hidden md:block">
              <div className="ml-2 flex items-center space-x-0.5">
                <Link
                  href="/dashboard"
                  className={`px-1.5 py-0.5 rounded-sm text-xs font-medium transition-colors duration-150 ${isActive('/dashboard') || isActive('/')}`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/compose"
                  className={`px-1.5 py-0.5 rounded-sm text-xs font-medium transition-colors duration-150 ${isActive('/compose')}`}
                >
                  Email Composer
                </Link>
                <Link
                  href="/subscription"
                  className={`px-1.5 py-0.5 rounded-sm text-xs font-medium transition-colors duration-150 ${isActive('/subscription')}`}
                >
                  Subscription
                </Link>
                <Link
                  href="/profile"
                  className={`px-1.5 py-0.5 rounded-sm text-xs font-medium transition-colors duration-150 ${isActive('/profile')}`}
                >
                  Profile
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-1 flex items-center">
              <span className="text-xs mr-1">
                {user?.email || (devMode ? 'dev@example.com' : '')}
                {devMode && <span className="bg-yellow-400 text-xs text-black px-1 ml-1 rounded">DEV</span>}
              </span>
              <button
                onClick={handleSignOut}
                className="px-1.5 py-0.5 border border-transparent text-xs font-medium rounded-sm
                          text-white bg-blue-600 hover:bg-blue-500 transition-colors duration-150"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex flex-col justify-center items-center w-5 h-5 bg-blue-600 rounded-sm p-1"
              aria-expanded="false"
            >
              <span className="sr-only">Toggle menu</span>
              {!isMenuOpen ? (
                <>
                  <span className="block w-3 h-0.5 bg-white mb-0.5"></span>
                  <span className="block w-3 h-0.5 bg-white mb-0.5"></span>
                  <span className="block w-3 h-0.5 bg-white"></span>
                </>
              ) : (
                <>
                  <span className="block w-3 h-0.5 bg-white transform rotate-45 translate-y-0.5"></span>
                  <span className="block w-3 h-0.5 bg-white opacity-0"></span>
                  <span className="block w-3 h-0.5 bg-white transform -rotate-45 -translate-y-0.5"></span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/dashboard"
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/dashboard') || isActive('/')
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/compose"
              className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/compose')}`}
            >
              Email Composer
            </Link>
            <Link
              href="/subscription"
              className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/subscription')}`}
            >
              Subscription
            </Link>
            <Link
              href="/profile"
              className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/profile')}`}
            >
              Profile
            </Link>
            <div className="mt-3 flex flex-col">
              <span className="text-sm mb-2">
                {user?.email || (devMode ? 'dev@example.com' : '')}
                {devMode && <span className="bg-yellow-400 text-xs text-black px-1 ml-1 rounded">DEV</span>}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-2 border border-transparent text-sm font-medium rounded-md
                          text-white bg-blue-600 hover:bg-blue-500 transition-colors duration-150"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
