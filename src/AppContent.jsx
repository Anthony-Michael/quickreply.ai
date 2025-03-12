import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { trackedLazyImport } from './lib/lazyLoadAnalytics';

// Import Navigation and Auth normally since they're needed immediately
import Navigation from './components/Navigation';
import Auth from './components/Auth';
import DevLazyLoadStats from './components/DevLazyLoadStats';

// Lazy load components that aren't needed immediately with tracking
const Dashboard = React.lazy(() => 
  trackedLazyImport(() => import('./components/Dashboard'), 'Dashboard')
);
const EmailComposer = React.lazy(() => 
  trackedLazyImport(() => import('./components/EmailComposer'), 'EmailComposer')
);
const SubscriptionManagement = React.lazy(() => 
  trackedLazyImport(() => import('./components/SubscriptionManagement'), 'SubscriptionManagement')
);
const ProfileSettings = React.lazy(() => 
  trackedLazyImport(() => import('./components/ProfileSettings'), 'ProfileSettings')
);

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    <p className="ml-3 text-lg text-gray-700">Loading...</p>
  </div>
);

// Protected Route wrapper component
const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

const AppContent = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <Dashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <Dashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/compose"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <EmailComposer />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscription"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <SubscriptionManagement />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <ProfileSettings />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
        {/* Development performance monitor */}
        <DevLazyLoadStats />
      </div>
    </Router>
  );
};

export default AppContent; 