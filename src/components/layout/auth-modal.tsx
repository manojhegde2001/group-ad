'use client';

import { useAuthModal } from '@/hooks/use-modal';
import { X } from 'lucide-react';
import { LoginForm } from '../auth/login-form';
import SignupForm from '../auth/signup-form';
import { useEffect } from 'react';

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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" onClick={close}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-white dark:bg-secondary-900 rounded-3xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary-400 via-violet-500 to-primary-600" />

        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors text-secondary-400"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tab Toggle */}
        <div className="px-8 pt-6 pb-2">
          <div className="flex bg-secondary-100 dark:bg-secondary-800 rounded-xl p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === 'login'
                  ? 'bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow-sm'
                  : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
                }`}
            >
              Log in
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === 'signup'
                  ? 'bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow-sm'
                  : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
                }`}
            >
              Sign up
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 overflow-y-auto max-h-[80vh]">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-secondary-900 dark:text-white">
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
