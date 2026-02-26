'use client';

import { useAuthModal } from '@/hooks/use-modal';
import { X } from 'lucide-react';
import { LoginForm } from '../auth/login-form';
import SignupForm from '../auth/signup-form';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function AuthModal() {
  const { isOpen, mode, close, setMode } = useAuthModal();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-4" onClick={close}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

      {/* Modal — bottom sheet on mobile, centered on sm+ */}
      <div
        className="relative w-full sm:max-w-md bg-white dark:bg-secondary-900 sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in rounded-t-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-secondary-300 dark:bg-secondary-700 rounded-full" />
        </div>

        {/* Top gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary-400 via-violet-500 to-primary-600 sm:rounded-t-3xl hidden sm:block" />

        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors text-secondary-400"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tab Toggle */}
        <div className="px-5 sm:px-8 pt-4 sm:pt-6 pb-2">
          <div className="flex bg-secondary-100 dark:bg-secondary-800 rounded-xl p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === 'login'
                ? 'bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow-sm'
                : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
                }`}
            >
              Log in
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === 'signup'
                ? 'bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow-sm'
                : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
                }`}
            >
              Sign up
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 sm:px-8 py-4 sm:py-6 overflow-y-auto max-h-[75vh] sm:max-h-[80vh]">
          <div className="mb-4 sm:mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-secondary-900 dark:text-white">
              {mode === 'login' ? 'Welcome back 👋' : 'Create your account'}
            </h2>
            <p className="text-sm text-secondary-500 mt-1">
              {mode === 'login'
                ? 'Sign in to continue to Group Ad'
                : 'Join thousands of professionals on Group Ad'}
            </p>
          </div>

          {mode === 'login' ? <LoginForm /> : <SignupForm />}
        </div>
      </div>
    </div>
  );
}
