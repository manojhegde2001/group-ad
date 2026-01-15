'use client';

import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp, Users, Zap } from 'lucide-react';

export function HeroSection() {
  const { user } = useAuth();
  const { open } = useAuthModal();

  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-secondary-50 to-primary/10 dark:from-secondary-900 dark:via-secondary-800 dark:to-secondary-900 py-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-700 bg-clip-text text-transparent">
          Discover & Share
        </h1>
        <p className="text-xl md:text-2xl text-secondary-700 dark:text-secondary-300 mb-8 max-w-3xl mx-auto">
          Connect with millions of users, share your ideas, and grow your business
        </p>

        {!user && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              variant="solid"
              color="primary"
              size="lg"
              onClick={() => open('signup')}
            >
              Get Started Free
            </Button>
            <Button
              variant="outline"
              color="primary"
              size="lg"
              onClick={() => open('login')}
            >
              Sign In
            </Button>
          </div>
        )}

        <div className="max-w-2xl mx-auto mb-16">
          <Input
            type="search"
            placeholder="Search for ideas, trends, people..."
            size="lg"
            prefix={<Search className="w-5 h-5" />}
            className="shadow-lg"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-secondary-800 rounded-2xl p-6 shadow-lg">
            <Users className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-3xl font-bold mb-2">10M+</h3>
            <p className="text-secondary-600 dark:text-secondary-400">Active Users</p>
          </div>
          <div className="bg-white dark:bg-secondary-800 rounded-2xl p-6 shadow-lg">
            <TrendingUp className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-3xl font-bold mb-2">50M+</h3>
            <p className="text-secondary-600 dark:text-secondary-400">Posts Shared</p>
          </div>
          <div className="bg-white dark:bg-secondary-800 rounded-2xl p-6 shadow-lg">
            <Zap className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-3xl font-bold mb-2">99.9%</h3>
            <p className="text-secondary-600 dark:text-secondary-400">Uptime</p>
          </div>
        </div>
      </div>
    </section>
  );
}
