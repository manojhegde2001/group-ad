'use client';

import { useAuthModal } from '@/hooks/use-modal';
import { Modal } from 'rizzui';
import { X } from 'lucide-react';
import { LoginForm } from '../auth/login-form';
import SignupForm from '../auth/signup-form';

export function AuthModal() {
  const { isOpen, mode, close } = useAuthModal();

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      size='lg'
      containerClassName="bg-white dark:bg-gray-900"
    >

      {/* Scrollable Content */}
      <div className="overflow-y-auto overflow-x-hidden px-6 sm:px-8 py-8">
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
    </Modal>
  );
}
