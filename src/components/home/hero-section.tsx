'use client';

import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { Sparkles } from 'lucide-react';

export function HeroSection() {
  const { user, loading } = useAuth();
  const { open } = useAuthModal();

  // Hide hero for logged-in users — go straight to feed
  if (loading || user) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-violet-900 py-14 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6 text-white/80 text-sm">
          <Sparkles className="w-3.5 h-3.5 text-primary-300" />
          Enterprise Social Networking Platform
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
          Discover Ideas &{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-violet-300">
            Grow Together
          </span>
        </h1>

        <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto leading-relaxed">
          A Pinterest-style platform for professionals. Share your work, find your industry, and build real connections.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => open('signup')}
            className="px-8 py-3.5 bg-white text-primary-800 font-bold rounded-full hover:bg-primary-50 transition-all hover:shadow-xl hover:shadow-primary-900/30 active:scale-95 text-sm"
          >
            Get Started — It's Free
          </button>
          <button
            onClick={() => open('login')}
            className="px-8 py-3.5 border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all text-sm"
          >
            Sign In
          </button>
        </div>

        {/* Social proof */}
        <p className="mt-8 text-white/40 text-xs">
          Join 10,000+ professionals already on Group Ad
        </p>
      </div>
    </section>
  );
}
