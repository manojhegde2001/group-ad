'use client';

import { Modal, Title } from 'rizzui';
import { useAuthModal } from '@/hooks/use-modal';
import { LoginForm } from '@/components/auth/login-form';
import { SignupForm } from '@/components/auth/signup-form';

export function AuthModal() {
  const { isOpen, mode, close } = useAuthModal();

  return (
    <Modal isOpen={isOpen} onClose={close} size="md">
      <div className="p-6">
        <Title className="text-2xl font-bold mb-6 text-center">
          {mode === 'login' ? 'Welcome Back' : 'Join Group Ad'}
        </Title>

        {mode === 'login' ? <LoginForm /> : <SignupForm />}
      </div>
    </Modal>
  );
}
