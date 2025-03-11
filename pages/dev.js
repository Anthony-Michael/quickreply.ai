import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DevMode() {
  const [status, setStatus] = useState('Initializing development mode...');
  
  useEffect(() => {
    // Only run in development environment
    if (process.env.NODE_ENV !== 'development') {
      setStatus('Development mode page only available in development environment');
      return;
    }
    
    // Set development auth in localStorage
    try {
      window.localStorage.setItem('quickreply_dev_auth', 'true');
      setStatus('Development authentication set successfully!');
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error) {
      setStatus(`Error setting development mode: ${error.message}`);
    }
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h1 className="text-center text-2xl font-bold text-gray-900">
            QuickReply.ai - Development Mode
          </h1>
          
          <div className="mt-6 text-center">
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
              <p className="font-bold">Development Environment</p>
              <p>This page is for development testing only.</p>
            </div>
            
            <div className="mt-4 mb-6">
              <div className="inline-block border border-gray-300 rounded-full px-4 py-2 bg-blue-50">
                {status}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mt-2">
              If you're not automatically redirected, {' '}
              <Link href="/" className="text-blue-600 hover:underline">
                click here to go to the app
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 