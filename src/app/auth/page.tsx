'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import SignupForm from '@/components/auth/signup-form';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function AuthContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? true : false;
  const [isSignUp, setIsSignUp] = useState(initialMode);
  
  // Also detect if on mobile to use a stacked/fade layout instead of side-by-side slider
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Typical md breakpoint
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsSignUp(searchParams.get('mode') === 'signup');
  }, [searchParams]);

  if (isMobile) {
    return (
      <div className="min-h-[100dvh] bg-white dark:bg-secondary-950 flex flex-col px-6 pt-6 pb-4">
        <div className="absolute top-4 left-4 z-50">
          <Link href="/" className="p-2 flex items-center justify-center text-secondary-400 hover:text-primary-600 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
        </div>
        
        <div className="flex-1 flex flex-col w-full max-w-sm mx-auto justify-center">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg shadow-primary-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black text-secondary-900 dark:text-white mb-2 tracking-tight">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-secondary-500 dark:text-secondary-400 text-sm font-medium">
              {isSignUp ? 'Join us and start networking' : 'Sign in to your account'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {isSignUp ? (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full pb-4"
              >
                <SignupForm onToggle={() => setIsSignUp(false)} />
              </motion.div>
            ) : (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <LoginForm onToggle={() => setIsSignUp(true)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex flex-col items-center justify-center p-4">
      <div className="absolute top-8 left-8 z-50">
        <Link href="/" className="flex items-center gap-2 text-secondary-500 hover:text-primary-600 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> Back
        </Link>
      </div>

      {/* Double Slider Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden w-full max-w-[1024px] bg-white dark:bg-secondary-900 rounded-[2.5rem] shadow-2xl border border-secondary-100 dark:border-secondary-800 min-h-[650px]"
      >
        {/* Sign In Container */}
        <div 
          className={`absolute top-0 left-0 h-full w-1/2 transition-all duration-700 ease-in-out z-10 flex flex-col justify-center px-12 pb-10 pt-4
            ${isSignUp ? 'translate-x-[100%] opacity-0 z-1 pointer-events-none' : 'translate-x-0 opacity-100 z-20 pointer-events-auto'}
          `}
        >
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-4xl font-black text-secondary-900 dark:text-white mb-3 tracking-tight">Sign in</h1>
            <p className="text-secondary-500 dark:text-secondary-400 font-medium tracking-tight">Enter your credentials to access your account.</p>
          </div>
          <div className="w-full max-w-sm mx-auto">
            <LoginForm hideFooter />
          </div>
        </div>

        {/* Sign Up Container */}
        <div 
          className={`absolute top-0 left-0 h-full w-1/2 transition-all duration-700 ease-in-out flex flex-col px-12 justify-center py-8
            ${isSignUp ? 'translate-x-[100%] opacity-100 z-20 pointer-events-auto' : 'translate-x-0 opacity-0 z-1 pointer-events-none'}
          `}
        >
          <div className="flex flex-col items-center text-center mb-6">
            <h1 className="text-4xl font-black text-secondary-900 dark:text-white mb-2 tracking-tight">Create Account</h1>
            <p className="text-secondary-500 dark:text-secondary-400 font-medium">Join us and start networking.</p>
          </div>
          <div className="w-full max-w-sm mx-auto max-h-[70vh] overflow-y-auto no-scrollbar pb-6 pr-2">
            <SignupForm hideFooter />
          </div>
        </div>

        {/* Overlay Container */}
        <div 
          className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-[100] pointer-events-none
            ${isSignUp ? '-translate-x-[100%]' : 'translate-x-0'}
          `}
        >
          <div 
            className={`bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-600 relative -left-[100%] h-full w-[200%] transition-transform duration-700 ease-in-out text-white
              ${isSignUp ? 'translate-x-[50%]' : 'translate-x-0'}
            `}
          >
            {/* Overlay Left */}
            <div 
              className={`absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center p-12 text-center transition-transform duration-700 ease-in-out pointer-events-auto
                ${isSignUp ? 'translate-x-0' : '-translate-x-[20%]'}
              `}
            >
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md border border-white/30 rounded-3xl flex items-center justify-center text-white mb-8 shadow-2xl">
                <ShieldCheck className="w-10 h-10 drop-shadow-lg" />
              </div>
              <h1 className="text-4xl font-black mb-6 text-white drop-shadow-md">Welcome Back!</h1>
              <p className="text-primary-50 font-medium mb-10 leading-relaxed text-lg max-w-[80%]">
                To keep connected with us please login with your personal info
              </p>
              <button 
                onClick={() => setIsSignUp(false)}
                className="bg-transparent border-2 border-white text-white rounded-full px-12 py-3.5 font-bold uppercase tracking-wider text-sm hover:bg-white hover:text-primary-600 transition-all duration-300 active:scale-95 z-50 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
              >
                Sign In
              </button>
            </div>

            {/* Overlay Right */}
            <div 
              className={`absolute top-0 right-0 w-1/2 h-full flex flex-col items-center justify-center p-12 text-center transition-transform duration-700 ease-in-out pointer-events-auto
                ${isSignUp ? 'translate-x-[20%]' : 'translate-x-0'}
              `}
            >
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md border border-white/30 rounded-3xl flex items-center justify-center text-white mb-8 shadow-2xl">
                <ShieldCheck className="w-10 h-10 drop-shadow-lg" />
              </div>
              <h1 className="text-4xl font-black mb-6 text-white drop-shadow-md">Hello, Friend!</h1>
              <p className="text-primary-50 font-medium mb-10 leading-relaxed text-lg max-w-[80%]">
                Enter your personal details and start journey with us
              </p>
              <button 
                onClick={() => setIsSignUp(true)}
                className="bg-transparent border-2 border-white text-white rounded-full px-12 py-3.5 font-bold uppercase tracking-wider text-sm hover:bg-white hover:text-primary-600 transition-all duration-300 active:scale-95 z-50 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthContent />
    </React.Suspense>
  );
}
