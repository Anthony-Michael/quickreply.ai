import React from 'react';
import dynamic from 'next/dynamic';
import ErrorBoundary from './components/ErrorBoundary';

// Use dynamic import to ensure client-side only rendering for the router
const AppContent = dynamic(() => import('./AppContent'), {
  ssr: false, // Disable server-side rendering
  loading: () => <div className='flex justify-center items-center h-screen'>Loading App...</div>,
});

const App = () => {
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
