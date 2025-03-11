import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function MockEntry() {
  const router = useRouter();

  useEffect(() => {
    // Set development auth flag in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('quickreply_dev_auth', 'true');
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/mock');
      }, 1500);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">QuickReply.ai Mock Mode</h1>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800">
            Setting up mock environment...
            <br />
            You will be redirected automatically.
          </p>
        </div>
        
        <div className="space-y-4">
          <p>If you're not redirected automatically, click one of the links below:</p>
          
          <div className="flex flex-col space-y-2">
            <Link 
              href="/mock" 
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Mock Dashboard
            </Link>
            
            <Link 
              href="/mock/compose" 
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Mock Email Composer
            </Link>
            
            <Link 
              href="/mock/profile" 
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Mock Profile Page
            </Link>
            
            <Link 
              href="/mock/subscription" 
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Mock Subscription Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 