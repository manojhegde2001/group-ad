'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useState } from 'react';

export function useAuth() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

 const logout = async () => {
    try {
      // Sign out and update session immediately
      await signOut({ 
        redirect: false,
        callbackUrl: '/'
      });
      
      // Update session to trigger re-render
      await update();
      
      toast.success('Logged out successfully! 👋');
      
      // Navigate without reload
      router.push('/');
      
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  return {
    user: session?.user || null,
    loading: status === 'loading',
    isAuthenticated: !!session?.user && !isLoggingOut,
    refreshAuth: update,
    logout,
  };
}
