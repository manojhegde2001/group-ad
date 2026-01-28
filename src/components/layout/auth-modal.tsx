'use client';

import { useAuthModal } from '@/hooks/use-modal';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { LoginForm } from '../auth/login-form';
import SignupForm from '../auth/signup-form';

export function AuthModal() {
  const { isOpen, mode, close } = useAuthModal();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={close}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-secondary-800 rounded-2xl shadow-xl w-full max-w-md relative animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={close}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-secondary-600 dark:text-secondary-400">
                {mode === 'login'
                  ? 'Sign in to continue to GroupAd'
                  : 'Join our community today'}
              </p>
            </div>

            {mode === 'login' ? <LoginForm /> : <SignupForm />}
          </div>
        </div>
      </div>
    </>
  );
}
