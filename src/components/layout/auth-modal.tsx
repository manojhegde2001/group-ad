'use client';

import { useAuthModal } from '@/hooks/use-modal';
import { X } from 'lucide-react';
import { ActionIcon } from '../ui/action-icon';
import { LoginForm } from '../auth/login-form';
import SignupForm from '../auth/signup-form';
import { useEffect } from 'react';

export function AuthModal() {
  const { isOpen, mode, close, setMode, isDirty } = useAuthModal();

  const handleClose = () => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        return;
      }
    }
    close();
  };

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
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-4" onClick={handleClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        className="relative z-10 w-full sm:max-w-md bg-white dark:bg-secondary-900 sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in rounded-t-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-secondary-100 dark:border-secondary-800">
          {/* Drag handle — mobile only */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-secondary-200 dark:bg-secondary-700 rounded-full sm:hidden" />

          <h2 className="text-base font-bold text-secondary-900 dark:text-white mt-1 sm:mt-0">
            {mode === 'login' ? 'Welcome back 👋' : 'Join Group Ad'}
          </h2>

          <div className="flex-shrink-0 mt-1 sm:mt-0">
            <ActionIcon
              variant="flat"
              color="secondary"
              rounded="full"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </ActionIcon>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="px-5 sm:px-6 pt-4 pb-1">
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

        {/* Subtitle */}
        <div className="px-5 sm:px-6 pt-3">
          <p className="text-xs text-secondary-400">
            {mode === 'login'
              ? 'Sign in to continue to Group Ad'
              : 'Join thousands of professionals on Group Ad'}
          </p>
        </div>

        {/* Content */}
        <div className="px-5 sm:px-6 py-4 overflow-y-auto max-h-[70vh] sm:max-h-[78vh]">
          {mode === 'login' ? <LoginForm /> : <SignupForm />}
        </div>
      </div>
    </div>
  );
}
