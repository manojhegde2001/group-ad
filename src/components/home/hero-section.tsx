'use client';

import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  const { user, loading } = useAuth();
  const { open } = useAuthModal();

  // Hide hero for logged-in users — go straight to feed
  if (loading || user) return null;

  return (
    <section className="relative bg-white dark:bg-secondary-950 border-b border-secondary-100 dark:border-secondary-800 py-8 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-white mb-2 tracking-tight">
          Discover Ideas &{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-violet-500">
            Grow Together
          </span>
        </h1>
        <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-4 max-w-md mx-auto">
          A professional space to share your work and build real connections.
        </p>
        <div className="flex items-center gap-2.5 justify-center">
          <Button
            onClick={() => open('signup')}
            variant="solid"
            size="sm"
            rounded="pill"
            fullWidth={false}
            className="!bg-primary-600 !text-white hover:!bg-primary-700 font-semibold text-sm gap-1.5"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
          <Button
            onClick={() => open('login')}
            variant="outline"
            size="sm"
            rounded="pill"
            fullWidth={false}
            className="!border-secondary-200 dark:!border-secondary-700 !text-secondary-700 dark:!text-secondary-300 hover:!bg-secondary-50 dark:hover:!bg-secondary-800 text-sm"
          >
            Sign In
          </Button>
        </div>
      </div>
    </section>
  );
}
