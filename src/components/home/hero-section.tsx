'use client';

import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  const { user, loading } = useAuth();
  const { open } = useAuthModal();

  // Hide hero for logged-in users — go straight to feed
  if (loading || user) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-violet-900 py-12 sm:py-16 md:py-20 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-72 sm:w-96 h-72 sm:h-96 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-56 sm:w-72 h-56 sm:h-72 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-primary-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 sm:px-4 py-1.5 mb-4 sm:mb-6 text-white/80 text-xs sm:text-sm">
          <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-primary-300" />
          Enterprise Social Networking Platform
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white mb-3 sm:mb-4 tracking-tight">
          Discover Ideas &amp;{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-violet-300">
            Grow Together
          </span>
        </h1>

        <p className="text-base sm:text-lg text-white/70 mb-6 sm:mb-8 max-w-xl mx-auto leading-relaxed px-2">
          A Pinterest-style platform for professionals. Share your work, find your industry, and build real connections.
        </p>

        <div className="flex flex-col xs:flex-row gap-3 justify-center px-4 xs:px-0">
          <Button
            onClick={() => open('signup')}
            variant="solid"
            size="lg"
            rounded="pill"
            fullWidth={false}
            className="!bg-white !text-primary-800 font-bold hover:!bg-primary-50 hover:shadow-xl hover:shadow-primary-900/30 active:scale-95 text-sm"
          >
            Get Started — It&apos;s Free
          </Button>
          <Button
            onClick={() => open('login')}
            variant="outline"
            size="lg"
            rounded="pill"
            fullWidth={false}
            className="!border-white/30 !text-white hover:!bg-white/10 text-sm"
          >
            Sign In
          </Button>
        </div>

        {/* Social proof */}
        <p className="mt-6 sm:mt-8 text-white/40 text-xs">
          Join 10,000+ professionals already on Group Ad
        </p>
      </div>
    </section>
  );
}
