'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function ProfileRedirectPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && (user as any)?.username) {
        router.replace(`/profile/${(user as any).username}`);
      } else if (!isAuthenticated) {
        router.replace('/');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );
}