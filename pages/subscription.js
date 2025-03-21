import React, { useEffect, useState } from 'react';
import SubscriptionManagement from '../src/components/SubscriptionManagement';
import { useRouter } from 'next/router';
import { useUser } from '@supabase/auth-helpers-react';

export default function Subscription() {
  const router = useRouter();
  const user = useUser();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is authenticated
    if (!user && !loading) {
      router.push('/login');
    }
    setLoading(false);
  }, [user, router, loading]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center h-screen">Redirecting to login...</div>;
  }

  return <SubscriptionManagement />;
} 