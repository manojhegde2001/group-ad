'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { Input, Password, Button, Text } from 'rizzui';
import { Mail, Lock } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { close, setMode, onSuccessCallback } = useAuthModal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      close();
      if (onSuccessCallback) onSuccessCallback();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          prefix={<Mail className="w-4 h-4" />}
          required
          className="w-full"
        />
      </div>

      <div>
        <Password
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          prefix={<Lock className="w-4 h-4" />}
          required
          className="w-full"
        />
      </div>

      {error && (
        <Text className="text-red-500 text-sm">{error}</Text>
      )}

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary-600"
        isLoading={loading}
      >
        Login
      </Button>

      <div className="text-center">
        <Text className="text-sm text-secondary-600 dark:text-secondary-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => setMode('signup')}
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </button>
        </Text>
      </div>
    </form>
  );
}
