import React, { useEffect } from 'react';
import Auth from '../src/components/Auth';
import { useRouter } from 'next/router';
import { useUser } from '@supabase/auth-helpers-react';

export default function Signup() {
  const router = useRouter();
  const user = useUser();
  
  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  return <Auth isSignup={true} />;
} 